# Cognito Module Variables

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "hirehub"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

# Password Policy
variable "password_minimum_length" {
  description = "Minimum password length"
  type        = number
  default     = 12
}

variable "password_require_lowercase" {
  description = "Require lowercase"
  type        = bool
  default     = true
}

variable "password_require_numbers" {
  description = "Require numbers"
  type        = bool
  default     = true
}

variable "password_require_symbols" {
  description = "Require symbols"
  type        = bool
  default     = true
}

variable "password_require_uppercase" {
  description = "Require uppercase"
  type        = bool
  default     = true
}

variable "temporary_password_validity_days" {
  description = "Temporary password validity days"
  type        = number
  default     = 7
}

# MFA
variable "mfa_configuration" {
  description = "MFA configuration (OFF, ON, OPTIONAL)"
  type        = string
  default     = "OPTIONAL"
}

# Admin
variable "allow_admin_create_user_only" {
  description = "Only allow admin to create users"
  type        = bool
  default     = false
}

# Email Configuration
variable "ses_email_identity" {
  description = "SES email identity ARN"
  type        = string
  default     = null
}

variable "from_email_address" {
  description = "From email address"
  type        = string
  default     = null
}

variable "reply_to_email_address" {
  description = "Reply-to email address"
  type        = string
  default     = null
}

# Message Templates
variable "invite_email_message" {
  description = "Invite email message"
  type        = string
  default     = "Your username is {username} and temporary password is {####}."
}

variable "invite_email_subject" {
  description = "Invite email subject"
  type        = string
  default     = "Your HireHub account"
}

variable "invite_sms_message" {
  description = "Invite SMS message"
  type        = string
  default     = "Your username is {username} and temporary password is {####}."
}

variable "verification_email_message" {
  description = "Verification email message"
  type        = string
  default     = "Your verification code is {####}"
}

variable "verification_email_subject" {
  description = "Verification email subject"
  type        = string
  default     = "Verify your HireHub email"
}

variable "verification_sms_message" {
  description = "Verification SMS message"
  type        = string
  default     = "Your verification code is {####}"
}

# Custom Attributes
variable "custom_attributes" {
  description = "Custom user attributes"
  type = list(object({
    name           = string
    type           = string
    developer_only = optional(bool)
    mutable        = optional(bool)
    required       = optional(bool)
    min_length     = optional(number)
    max_length     = optional(number)
    min_value      = optional(number)
    max_value      = optional(number)
  }))
  default = []
}

# Security
variable "advanced_security_mode" {
  description = "Advanced security mode (OFF, AUDIT, ENFORCED)"
  type        = string
  default     = "AUDIT"
}

variable "kms_key_arn" {
  description = "KMS key ARN"
  type        = string
  default     = null
}

# Domain
variable "custom_domain" {
  description = "Custom domain (null for Cognito domain)"
  type        = string
  default     = null
}

variable "certificate_arn" {
  description = "ACM certificate ARN for custom domain"
  type        = string
  default     = null
}

# Client Configuration
variable "generate_client_secret" {
  description = "Generate client secret"
  type        = bool
  default     = true
}

variable "explicit_auth_flows" {
  description = "Explicit auth flows"
  type        = list(string)
  default = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_PASSWORD_AUTH"
  ]
}

variable "callback_urls" {
  description = "Callback URLs"
  type        = list(string)
  default     = ["https://localhost:3000/callback"]
}

variable "logout_urls" {
  description = "Logout URLs"
  type        = list(string)
  default     = ["https://localhost:3000/logout"]
}

variable "allowed_oauth_flows" {
  description = "Allowed OAuth flows"
  type        = list(string)
  default     = ["code"]
}

variable "allowed_oauth_scopes" {
  description = "Allowed OAuth scopes"
  type        = list(string)
  default     = ["email", "openid", "profile"]
}

variable "identity_providers" {
  description = "Identity providers"
  type        = list(string)
  default     = []
}

variable "access_token_validity_hours" {
  description = "Access token validity in hours"
  type        = number
  default     = 1
}

variable "id_token_validity_hours" {
  description = "ID token validity in hours"
  type        = number
  default     = 1
}

variable "refresh_token_validity_days" {
  description = "Refresh token validity in days"
  type        = number
  default     = 30
}

variable "read_attributes" {
  description = "Readable attributes"
  type        = list(string)
  default     = ["email", "name"]
}

variable "write_attributes" {
  description = "Writable attributes"
  type        = list(string)
  default     = ["email", "name"]
}

# Social Login - Google
variable "google_client_id" {
  description = "Google OAuth client ID"
  type        = string
  default     = null
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  default     = null
  sensitive   = true
}

# Social Login - Kakao
variable "kakao_client_id" {
  description = "Kakao OAuth client ID"
  type        = string
  default     = null
}

variable "kakao_client_secret" {
  description = "Kakao OAuth client secret"
  type        = string
  default     = null
  sensitive   = true
}

# Social Login - Naver
variable "naver_client_id" {
  description = "Naver OAuth client ID"
  type        = string
  default     = null
}

variable "naver_client_secret" {
  description = "Naver OAuth client secret"
  type        = string
  default     = null
  sensitive   = true
}

# User Groups
variable "user_groups" {
  description = "User groups"
  type = map(object({
    description = string
    precedence  = number
    role_arn    = optional(string)
  }))
  default = {
    admin = {
      description = "Administrators"
      precedence  = 1
    }
    recruiter = {
      description = "Recruiters"
      precedence  = 2
    }
    applicant = {
      description = "Job Applicants"
      precedence  = 3
    }
  }
}

# Identity Pool
variable "create_identity_pool" {
  description = "Create identity pool"
  type        = bool
  default     = true
}

variable "allow_unauthenticated_identities" {
  description = "Allow unauthenticated identities"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
