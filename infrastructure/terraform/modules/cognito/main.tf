# Cognito Module for HireHub with Social Login

locals {
  user_pool_name = "${var.environment}-${var.project_name}-users"
  common_tags = merge(var.tags, {
    Module = "cognito"
  })
}

# KMS Key for encryption
resource "aws_kms_key" "cognito" {
  count = var.kms_key_arn == null ? 1 : 0

  description             = "KMS key for Cognito ${local.user_pool_name}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.user_pool_name}-kms"
  })
}

# User Pool
resource "aws_cognito_user_pool" "main" {
  name = local.user_pool_name

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  username_configuration {
    case_sensitive = false
  }

  password_policy {
    minimum_length                   = var.password_minimum_length
    require_lowercase                = var.password_require_lowercase
    require_numbers                  = var.password_require_numbers
    require_symbols                  = var.password_require_symbols
    require_uppercase                = var.password_require_uppercase
    temporary_password_validity_days = var.temporary_password_validity_days
  }

  mfa_configuration = var.mfa_configuration

  dynamic "software_token_mfa_configuration" {
    for_each = var.mfa_configuration != "OFF" ? [1] : []
    content {
      enabled = true
    }
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  admin_create_user_config {
    allow_admin_create_user_only = var.allow_admin_create_user_only

    invite_message_template {
      email_message = var.invite_email_message
      email_subject = var.invite_email_subject
      sms_message   = var.invite_sms_message
    }
  }

  email_configuration {
    email_sending_account  = var.ses_email_identity != null ? "DEVELOPER" : "COGNITO_DEFAULT"
    source_arn             = var.ses_email_identity
    from_email_address     = var.from_email_address
    reply_to_email_address = var.reply_to_email_address
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_message        = var.verification_email_message
    email_subject        = var.verification_email_subject
    sms_message          = var.verification_sms_message
  }

  schema {
    name                     = "email"
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    required                 = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    name                     = "name"
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    required                 = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  dynamic "schema" {
    for_each = var.custom_attributes
    content {
      name                     = schema.value.name
      attribute_data_type      = schema.value.type
      developer_only_attribute = lookup(schema.value, "developer_only", false)
      mutable                  = lookup(schema.value, "mutable", true)
      required                 = lookup(schema.value, "required", false)

      dynamic "string_attribute_constraints" {
        for_each = schema.value.type == "String" ? [1] : []
        content {
          min_length = lookup(schema.value, "min_length", 0)
          max_length = lookup(schema.value, "max_length", 2048)
        }
      }

      dynamic "number_attribute_constraints" {
        for_each = schema.value.type == "Number" ? [1] : []
        content {
          min_value = lookup(schema.value, "min_value", null)
          max_value = lookup(schema.value, "max_value", null)
        }
      }
    }
  }

  user_pool_add_ons {
    advanced_security_mode = var.advanced_security_mode
  }

  tags = merge(local.common_tags, {
    Name = local.user_pool_name
  })
}

# User Pool Domain
resource "aws_cognito_user_pool_domain" "main" {
  domain       = var.custom_domain != null ? var.custom_domain : "${var.environment}-${var.project_name}"
  user_pool_id = aws_cognito_user_pool.main.id

  certificate_arn = var.custom_domain != null ? var.certificate_arn : null
}

# User Pool Client
resource "aws_cognito_user_pool_client" "main" {
  name         = "${local.user_pool_name}-client"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret                      = var.generate_client_secret
  explicit_auth_flows                  = var.explicit_auth_flows
  supported_identity_providers         = concat(["COGNITO"], var.identity_providers)
  callback_urls                        = var.callback_urls
  logout_urls                          = var.logout_urls
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = var.allowed_oauth_flows
  allowed_oauth_scopes                 = var.allowed_oauth_scopes

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  access_token_validity  = var.access_token_validity_hours
  id_token_validity      = var.id_token_validity_hours
  refresh_token_validity = var.refresh_token_validity_days

  prevent_user_existence_errors = "ENABLED"
  enable_token_revocation       = true

  read_attributes  = var.read_attributes
  write_attributes = var.write_attributes
}

# Google Identity Provider
resource "aws_cognito_identity_provider" "google" {
  count = var.google_client_id != null ? 1 : 0

  user_pool_id  = aws_cognito_user_pool.main.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    client_id        = var.google_client_id
    client_secret    = var.google_client_secret
    authorize_scopes = "profile email openid"
  }

  attribute_mapping = {
    email    = "email"
    name     = "name"
    username = "sub"
  }
}

# Kakao Identity Provider (Korean social login)
resource "aws_cognito_identity_provider" "kakao" {
  count = var.kakao_client_id != null ? 1 : 0

  user_pool_id  = aws_cognito_user_pool.main.id
  provider_name = "Kakao"
  provider_type = "OIDC"

  provider_details = {
    client_id                     = var.kakao_client_id
    client_secret                 = var.kakao_client_secret
    authorize_scopes              = "profile_nickname account_email"
    oidc_issuer                   = "https://kauth.kakao.com"
    attributes_request_method     = "GET"
    authorize_url                 = "https://kauth.kakao.com/oauth/authorize"
    token_url                     = "https://kauth.kakao.com/oauth/token"
    attributes_url                = "https://kapi.kakao.com/v2/user/me"
    jwks_uri                      = "https://kauth.kakao.com/.well-known/jwks.json"
  }

  attribute_mapping = {
    email    = "email"
    name     = "nickname"
    username = "sub"
  }
}

# Naver Identity Provider (Korean social login)
resource "aws_cognito_identity_provider" "naver" {
  count = var.naver_client_id != null ? 1 : 0

  user_pool_id  = aws_cognito_user_pool.main.id
  provider_name = "Naver"
  provider_type = "OIDC"

  provider_details = {
    client_id                 = var.naver_client_id
    client_secret             = var.naver_client_secret
    authorize_scopes          = "name email"
    attributes_request_method = "GET"
    authorize_url             = "https://nid.naver.com/oauth2.0/authorize"
    token_url                 = "https://nid.naver.com/oauth2.0/token"
    attributes_url            = "https://openapi.naver.com/v1/nid/me"
    oidc_issuer               = "https://nid.naver.com"
  }

  attribute_mapping = {
    email    = "email"
    name     = "name"
    username = "sub"
  }
}

# User Pool Groups
resource "aws_cognito_user_group" "groups" {
  for_each = var.user_groups

  name         = each.key
  user_pool_id = aws_cognito_user_pool.main.id
  description  = each.value.description
  precedence   = each.value.precedence
  role_arn     = lookup(each.value, "role_arn", null)
}

# Identity Pool for federated identities
resource "aws_cognito_identity_pool" "main" {
  count = var.create_identity_pool ? 1 : 0

  identity_pool_name               = "${var.environment}-${var.project_name}-identity"
  allow_unauthenticated_identities = var.allow_unauthenticated_identities
  allow_classic_flow               = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.main.id
    provider_name           = aws_cognito_user_pool.main.endpoint
    server_side_token_check = true
  }

  tags = local.common_tags
}

# Identity Pool Roles
resource "aws_cognito_identity_pool_roles_attachment" "main" {
  count = var.create_identity_pool ? 1 : 0

  identity_pool_id = aws_cognito_identity_pool.main[0].id

  roles = {
    "authenticated"   = aws_iam_role.authenticated[0].arn
    "unauthenticated" = var.allow_unauthenticated_identities ? aws_iam_role.unauthenticated[0].arn : null
  }
}

# Authenticated Role
resource "aws_iam_role" "authenticated" {
  count = var.create_identity_pool ? 1 : 0

  name = "${local.user_pool_name}-authenticated-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = "cognito-identity.amazonaws.com"
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.main[0].id
        }
        "ForAnyValue:StringLike" = {
          "cognito-identity.amazonaws.com:amr" = "authenticated"
        }
      }
    }]
  })

  tags = local.common_tags
}

# Unauthenticated Role
resource "aws_iam_role" "unauthenticated" {
  count = var.create_identity_pool && var.allow_unauthenticated_identities ? 1 : 0

  name = "${local.user_pool_name}-unauthenticated-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = "cognito-identity.amazonaws.com"
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.main[0].id
        }
        "ForAnyValue:StringLike" = {
          "cognito-identity.amazonaws.com:amr" = "unauthenticated"
        }
      }
    }]
  })

  tags = local.common_tags
}
