// User Types
export interface User {
  _id: string
  email: string
  firstName: string
  lastName: string
  role: 'student' | 'counselor' | 'admin' | 'moderator'
  educationLevel?: 'high-school' | 'undergraduate' | 'postgraduate' | 'phd' | 'working-professional' | 'other'
  institution?: Institution
  profile?: UserProfile
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say'
  phoneNumber?: string
  emergencyContact?: EmergencyContact
  preferredLanguage: string
  timezone: string
  avatar?: string
  bio?: string
  interests?: string[]
  mentalHealthHistory?: MentalHealthHistory
}

export interface EmergencyContact {
  name: string
  relationship: string
  phoneNumber: string
  email?: string
}

export interface MentalHealthHistory {
  hasHistory: boolean
  currentTreatment?: string
  medications?: string[]
  previousCounseling?: boolean
  crisisHistory?: boolean
}

// Institution Types
export interface Institution {
  _id: string
  name: string
  type: 'school' | 'college' | 'university'
  location: {
    state: string
    city: string
    address: string
  }
  contact: {
    email: string
    phone: string
    website?: string
  }
  isActive: boolean
}

// Authentication Types
export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LoginCredentials {
  email: string
  password: string
  userType?: 'student' | 'counselor' | 'admin' | 'moderator'
  rememberMe?: boolean
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  educationLevel?: string
  agreeToTerms: boolean
}

// Chatbot Types
export interface ChatMessage {
  _id: string
  userId: string
  message: string
  isFromUser: boolean
  timestamp: string
  sessionId: string
  metadata?: {
    sentiment?: 'positive' | 'negative' | 'neutral'
    urgency?: 'low' | 'medium' | 'high' | 'crisis'
    category?: string
  }
}

export interface ChatSession {
  _id: string
  userId: string
  startTime: string
  endTime?: string
  isActive: boolean
  messageCount: number
  summary?: string
}

// Appointment Types
export interface Appointment {
  _id: string
  studentId: string
  counselorId: string
  date: string
  time: string
  duration: number // in minutes
  type: 'individual' | 'group' | 'emergency'
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
  notes?: string
  meetingLink?: string
  location?: string
  createdAt: string
  updatedAt: string
}

export interface Counselor {
  _id: string
  user: User
  specialization: string[]
  experience: number
  languages: string[]
  availability: Availability[]
  rating: number
  totalSessions: number
  bio: string
  qualifications: string[]
  isAvailable: boolean
}

export interface Availability {
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  startTime: string
  endTime: string
  isAvailable: boolean
}

// Community Types (replacing Forum Types)
export interface CommunityPost {
  _id: string
  author: {
    _id: string
    firstName: string
    lastName: string
    profile?: {
      avatar?: string
    }
  }
  title: string
  content: string
  category: string
  tags: string[]
  images?: string[]
  isAnonymous: boolean
  isPinned: boolean
  isLocked: boolean
  likes: string[]
  dislikes: string[]
  comments: string[] | CommunityComment[] // Can be IDs or populated comments
  views: number
  shares: number
  isReported: boolean
  reportReason?: string
  isApproved: boolean
  createdAt: string
  updatedAt: string
  // Virtuals
  likeCount: number
  dislikeCount: number
  commentCount: number
}

export interface CommunityComment {
  _id: string
  post: string
  author: {
    _id: string
    firstName: string
    lastName: string
    profile?: {
      avatar?: string
    }
  }
  content: string
  parentComment?: string
  replies: string[] | CommunityComment[] // Can be IDs or populated replies
  likes: string[]
  dislikes: string[]
  isEdited: boolean
  editedAt?: string
  isDeleted: boolean
  deletedAt?: string
  isReported: boolean
  reportReason?: string
  isApproved: boolean
  createdAt: string
  updatedAt: string
  // Virtuals
  likeCount: number
  dislikeCount: number
  replyCount: number
}

export interface CommunityCategory {
  value: string
  label: string
  description: string
}

// Legacy Forum Types (for backward compatibility)
export interface ForumPost extends CommunityPost {}
export interface ForumReply extends CommunityComment {}
export interface ForumCategory extends CommunityCategory {}

// Resource Types
export interface Resource {
  _id: string
  title: string
  description: string
  content: string
  type: 'article' | 'video' | 'audio' | 'worksheet' | 'infographic'
  category: ResourceCategory
  language: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration?: number // in minutes
  tags: string[]
  author: string
  isPublished: boolean
  views: number
  likes: number
  fileUrl?: string
  thumbnailUrl?: string
  createdAt: string
  updatedAt: string
}

export interface ResourceCategory {
  _id: string
  name: string
  description: string
  icon: string
  color: string
  isActive: boolean
}

// Analytics Types
export interface Analytics {
  totalUsers: number
  activeUsers: number
  totalSessions: number
  crisisInterventions: number
  appointmentBookings: number
  forumPosts: number
  resourceViews: number
  userEngagement: {
    daily: number[]
    weekly: number[]
    monthly: number[]
  }
  popularResources: Resource[]
  commonIssues: {
    issue: string
    count: number
  }[]
  demographics: {
    ageGroups: { range: string; count: number }[]
    institutions: { name: string; count: number }[]
    languages: { language: string; count: number }[]
  }
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Form Types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'checkbox' | 'radio'
  required: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
    custom?: (value: any) => string | undefined
  }
}


// Crisis Support Types
export interface CrisisAlert {
  _id: string
  userId: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  trigger: string
  message: string
  location?: {
    latitude: number
    longitude: number
  }
  isResolved: boolean
  assignedCounselor?: string
  response?: string
  createdAt: string
  resolvedAt?: string
}
