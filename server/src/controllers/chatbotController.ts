import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import { Chat } from '../models/Chat'
import { User } from '../models/User'
import { AuthRequest } from '../middleware/auth'
import geminiService from '../services/geminiService'
import crisisDetectionService from '../services/crisisDetectionService'
import encryptionService from '../services/encryptionService'
import logger from '../utils/logger'
import { v4 as uuidv4 } from 'uuid'

// @desc    Send message to chatbot
// @route   POST /api/chatbot/message
// @access  Private
export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array())
      console.log('Request body:', req.body)
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      })
      return
    }

    const { message, sessionId } = req.body
    const userId = req.user?._id

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      })
      return
    }

    // Generate user-specific encryption key
    const masterKey = process.env.ENCRYPTION_MASTER_KEY || 'default-master-key-change-in-production'
    const userKey = encryptionService.generateUserKey(userId.toString(), masterKey)

    // Check if message contains sensitive information
    const containsSensitiveInfo = encryptionService.containsSensitiveInfo(message)
    const sanitizedMessage = containsSensitiveInfo ? encryptionService.sanitizeMessage(message) : message

    // Enhanced ML-based crisis detection
    const crisisDetection = crisisDetectionService.analyzeCrisis(message)
    
    // Log crisis detection for monitoring
    if (crisisDetection.isCrisis) {
      crisisDetectionService.logCrisisDetection(crisisDetection, userId.toString(), message)
    }

    let chatSession
    let sessionIdToUse = sessionId

    // Find or create chat session
    if (sessionIdToUse) {
      chatSession = await Chat.findOne({ 
        sessionId: sessionIdToUse, 
        userId, 
        isActive: true 
      })
    }

    if (!chatSession) {
      sessionIdToUse = uuidv4()
      chatSession = new Chat({
        userId,
        sessionId: sessionIdToUse,
        messages: [],
        isActive: true
      })
      await chatSession.save()
    }

    // Prepare user message with encryption if needed
    const userMessageData: any = {
      role: 'user' as const,
      content: sanitizedMessage,
      timestamp: new Date(),
      isCrisis: crisisDetection.isCrisis,
      crisisSeverity: crisisDetection.severity,
      crisisConfidence: crisisDetection.confidence,
      crisisKeywords: crisisDetection.keywords,
      isEncrypted: containsSensitiveInfo
    }

    // Encrypt sensitive content if needed
    if (containsSensitiveInfo) {
      const encryptedData = encryptionService.encryptMessage(message, userKey)
      userMessageData.encryptedContent = encryptedData.encrypted
      userMessageData.encryptionMetadata = {
        iv: encryptedData.iv,
        salt: encryptedData.salt,
        timestamp: encryptedData.timestamp
      }
    }

    // Add user message to chat
    chatSession.messages.push(userMessageData as any)

    // Generate AI response with enhanced context
    let aiResponse: string
    const recentMessages = chatSession.messages.slice(-10)
    const context = recentMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')

    const sessionDuration = chatSession.createdAt 
      ? Date.now() - new Date(chatSession.createdAt).getTime() 
      : 0
    
    const enhancedContext = {
      recentMessages: context,
      messageCount: chatSession.messages.length,
      sessionDuration,
      isCrisis: crisisDetection.isCrisis,
      crisisSeverity: crisisDetection.severity,
      crisisConfidence: crisisDetection.confidence,
      userMood: message.includes('feeling') ? 'mood_mentioned' : 'general',
      sentiment: crisisDetection.sentiment,
      riskFactors: crisisDetection.riskFactors
    }

    if (crisisDetection.isCrisis) {
      aiResponse = crisisDetectionService.getCrisisResponse(crisisDetection.severity, crisisDetection.confidence)
      logger.warn(`Crisis message detected from user ${userId}: ${message}`, {
        severity: crisisDetection.severity,
        confidence: crisisDetection.confidence,
        keywords: crisisDetection.keywords
      })
    } else {
      aiResponse = await geminiService.generateResponse(message, JSON.stringify(enhancedContext))
    }

    // Prepare AI response message
    const aiMessageData: any = {
      role: 'assistant' as const,
      content: aiResponse,
      timestamp: new Date(),
      isCrisis: crisisDetection.isCrisis,
      crisisSeverity: crisisDetection.severity,
      crisisConfidence: crisisDetection.confidence,
      crisisKeywords: crisisDetection.keywords
    }

    // Add AI response to chat
    chatSession.messages.push(aiMessageData as any)

    // Save chat session
    await chatSession.save()

    res.json({
      success: true,
      data: {
        message: aiResponse,
        sessionId: sessionIdToUse,
        isCrisis: crisisDetection.isCrisis,
        crisisSeverity: crisisDetection.severity,
        crisisConfidence: crisisDetection.confidence,
        crisisKeywords: crisisDetection.keywords,
        timestamp: new Date(),
        containsSensitiveInfo,
        sanitizedMessage: containsSensitiveInfo ? sanitizedMessage : undefined
      }
    })

    logger.info(`Chat message processed for user ${userId}, session: ${sessionIdToUse}`, {
      crisisDetected: crisisDetection.isCrisis,
      severity: crisisDetection.severity,
      confidence: crisisDetection.confidence,
      encrypted: containsSensitiveInfo
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get chat history
// @route   GET /api/chatbot/history/:sessionId
// @access  Private
export const getChatHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sessionId } = req.params
    const userId = req.user?._id

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      })
      return
    }

    const chatSession = await Chat.findOne({ 
      sessionId, 
      userId, 
      isActive: true 
    }).select('messages sessionId createdAt updatedAt')

    if (!chatSession) {
      res.status(404).json({
        success: false,
        message: 'Chat session not found'
      })
      return
    }

    // Generate user-specific encryption key for decryption
    const masterKey = process.env.ENCRYPTION_MASTER_KEY || 'default-master-key-change-in-production'
    const userKey = encryptionService.generateUserKey(userId.toString(), masterKey)

    // Process messages to decrypt if needed
    const processedMessages = chatSession.messages.map(msg => {
      const messageData: any = {
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        isCrisis: msg.isCrisis,
        crisisSeverity: msg.crisisSeverity,
        crisisConfidence: msg.crisisConfidence,
        crisisKeywords: msg.crisisKeywords,
        isEncrypted: msg.isEncrypted
      }

      // Decrypt encrypted content if present
      if (msg.isEncrypted && msg.encryptedContent && msg.encryptionMetadata) {
        try {
          const encryptedMessage = {
            encrypted: msg.encryptedContent,
            iv: msg.encryptionMetadata.iv,
            salt: msg.encryptionMetadata.salt,
            timestamp: msg.encryptionMetadata.timestamp
          }
          messageData.originalContent = encryptionService.decryptMessage(encryptedMessage, userKey)
        } catch (error) {
          logger.error('Failed to decrypt message:', error)
          messageData.decryptionError = 'Failed to decrypt message'
        }
      }

      return messageData
    })

    res.json({
      success: true,
      data: {
        sessionId: chatSession.sessionId,
        messages: processedMessages,
        createdAt: chatSession.createdAt,
        updatedAt: chatSession.updatedAt
      }
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get user's chat sessions
// @route   GET /api/chatbot/sessions
// @access  Private
export const getChatSessions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      })
      return
    }

    const skip = (page - 1) * limit

    const chatSessions = await Chat.find({ 
      userId, 
      isActive: true 
    })
    .select('sessionId messages createdAt updatedAt')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)

    // Get total count for pagination
    const totalSessions = await Chat.countDocuments({ 
      userId, 
      isActive: true 
    })

    // Format sessions with preview of last message
    const formattedSessions = chatSessions.map(session => ({
      sessionId: session.sessionId,
      lastMessage: session.messages[session.messages.length - 1]?.content?.substring(0, 100) + '...' || 'No messages',
      messageCount: session.messages.length,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    }))

    res.json({
      success: true,
      data: {
        sessions: formattedSessions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalSessions / limit),
          totalSessions,
          hasNext: page < Math.ceil(totalSessions / limit),
          hasPrev: page > 1
        }
      }
    })
  } catch (error) {
    next(error)
  }
}

// @desc    End chat session
// @route   DELETE /api/chatbot/sessions/:sessionId
// @access  Private
export const endChatSession = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sessionId } = req.params
    const userId = req.user?._id

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      })
      return
    }

    const chatSession = await Chat.findOneAndUpdate(
      { sessionId, userId, isActive: true },
      { isActive: false },
      { new: true }
    )

    if (!chatSession) {
      res.status(404).json({
        success: false,
        message: 'Chat session not found'
      })
      return
    }

    res.json({
      success: true,
      message: 'Chat session ended successfully'
    })

    logger.info(`Chat session ${sessionId} ended by user ${userId}`)
  } catch (error) {
    next(error)
  }
}

// @desc    Get wellness tips
// @route   GET /api/chatbot/wellness-tips
// @access  Private
export const getWellnessTips = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tips = await geminiService.generateWellnessTips()

    res.json({
      success: true,
      data: {
        tips,
        timestamp: new Date()
      }
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Track user mood
// @route   POST /api/chatbot/mood
// @access  Private
export const trackMood = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { mood, notes, sessionId } = req.body
    const userId = req.user?._id

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      })
      return
    }

    // Validate mood (1-5 scale)
    if (!mood || mood < 1 || mood > 5) {
      res.status(400).json({
        success: false,
        message: 'Mood must be between 1 and 5'
      })
      return
    }

    // Store mood data (you can extend this to save to a separate Mood collection)
    const moodData = {
      userId,
      mood,
      notes: notes || '',
      sessionId: sessionId || null,
      timestamp: new Date()
    }

    // For now, we'll just return success. In a full implementation, you'd save this to a database
    logger.info(`Mood tracked for user ${userId}: ${mood}/5`)

    res.json({
      success: true,
      data: {
        mood: moodData.mood,
        timestamp: moodData.timestamp,
        message: 'Mood tracked successfully'
      }
    })
  } catch (error) {
    console.error('Error tracking mood:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to track mood'
    })
  }
}

