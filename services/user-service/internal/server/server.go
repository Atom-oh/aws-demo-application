package server

import (
	"context"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"github.com/hirehub/services/user-service/internal/service"
	userv1 "github.com/hirehub/proto/user/v1"
)

// RegisterUserServiceServer registers the UserServer with the gRPC server
func RegisterUserServiceServer(s *grpc.Server, srv *UserServer) {
	userv1.RegisterUserServiceServer(s, srv)
}

// UserServer implements the gRPC UserService
type UserServer struct {
	userv1.UnimplementedUserServiceServer
	service *service.UserService
}

// NewUserServer creates a new UserServer instance
func NewUserServer(svc *service.UserService) *UserServer {
	return &UserServer{
		service: svc,
	}
}

// ============================================================================
// User RPCs
// ============================================================================

// CreateUser creates a new user
func (s *UserServer) CreateUser(ctx context.Context, req *userv1.CreateUserRequest) (*userv1.CreateUserResponse, error) {
	if req.CognitoSub == "" {
		return nil, status.Error(codes.InvalidArgument, "cognito_sub is required")
	}
	if req.Email == "" {
		return nil, status.Error(codes.InvalidArgument, "email is required")
	}
	if req.UserType == userv1.UserType_USER_TYPE_UNSPECIFIED {
		return nil, status.Error(codes.InvalidArgument, "user_type is required")
	}

	user, err := s.service.CreateUser(ctx, req)
	if err != nil {
		return nil, err
	}

	return &userv1.CreateUserResponse{User: user}, nil
}

// GetUser retrieves a user by ID
func (s *UserServer) GetUser(ctx context.Context, req *userv1.GetUserRequest) (*userv1.GetUserResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}

	user, err := s.service.GetUser(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	return &userv1.GetUserResponse{User: user}, nil
}

// GetUserByCognitoSub retrieves a user by Cognito sub
func (s *UserServer) GetUserByCognitoSub(ctx context.Context, req *userv1.GetUserByCognitoSubRequest) (*userv1.GetUserResponse, error) {
	if req.CognitoSub == "" {
		return nil, status.Error(codes.InvalidArgument, "cognito_sub is required")
	}

	user, err := s.service.GetUserByCognitoSub(ctx, req.CognitoSub)
	if err != nil {
		return nil, err
	}

	return &userv1.GetUserResponse{User: user}, nil
}

// GetUserByEmail retrieves a user by email
func (s *UserServer) GetUserByEmail(ctx context.Context, req *userv1.GetUserByEmailRequest) (*userv1.GetUserResponse, error) {
	if req.Email == "" {
		return nil, status.Error(codes.InvalidArgument, "email is required")
	}

	user, err := s.service.GetUserByEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}

	return &userv1.GetUserResponse{User: user}, nil
}

// UpdateUser updates a user
func (s *UserServer) UpdateUser(ctx context.Context, req *userv1.UpdateUserRequest) (*userv1.UpdateUserResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}

	user, err := s.service.UpdateUser(ctx, req)
	if err != nil {
		return nil, err
	}

	return &userv1.UpdateUserResponse{User: user}, nil
}

// DeleteUser deletes a user
func (s *UserServer) DeleteUser(ctx context.Context, req *userv1.DeleteUserRequest) (*userv1.DeleteUserResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}

	err := s.service.DeleteUser(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	return &userv1.DeleteUserResponse{Success: true}, nil
}

// ListUsers lists users with pagination and filtering
func (s *UserServer) ListUsers(ctx context.Context, req *userv1.ListUsersRequest) (*userv1.ListUsersResponse, error) {
	return s.service.ListUsers(ctx, req)
}

// ============================================================================
// JobseekerProfile RPCs
// ============================================================================

// CreateJobseekerProfile creates a new jobseeker profile
func (s *UserServer) CreateJobseekerProfile(ctx context.Context, req *userv1.CreateJobseekerProfileRequest) (*userv1.CreateJobseekerProfileResponse, error) {
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}

	profile, err := s.service.CreateJobseekerProfile(ctx, req)
	if err != nil {
		return nil, err
	}

	return &userv1.CreateJobseekerProfileResponse{Profile: profile}, nil
}

// GetJobseekerProfile retrieves a jobseeker profile by ID
func (s *UserServer) GetJobseekerProfile(ctx context.Context, req *userv1.GetJobseekerProfileRequest) (*userv1.GetJobseekerProfileResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}

	profile, err := s.service.GetJobseekerProfile(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	return &userv1.GetJobseekerProfileResponse{Profile: profile}, nil
}

// GetJobseekerProfileByUserId retrieves a jobseeker profile by user ID
func (s *UserServer) GetJobseekerProfileByUserId(ctx context.Context, req *userv1.GetJobseekerProfileByUserIdRequest) (*userv1.GetJobseekerProfileResponse, error) {
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}

	profile, err := s.service.GetJobseekerProfileByUserId(ctx, req.UserId)
	if err != nil {
		return nil, err
	}

	return &userv1.GetJobseekerProfileResponse{Profile: profile}, nil
}

// UpdateJobseekerProfile updates a jobseeker profile
func (s *UserServer) UpdateJobseekerProfile(ctx context.Context, req *userv1.UpdateJobseekerProfileRequest) (*userv1.UpdateJobseekerProfileResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}

	profile, err := s.service.UpdateJobseekerProfile(ctx, req)
	if err != nil {
		return nil, err
	}

	return &userv1.UpdateJobseekerProfileResponse{Profile: profile}, nil
}

// ListJobseekerProfiles lists jobseeker profiles with pagination and filtering
func (s *UserServer) ListJobseekerProfiles(ctx context.Context, req *userv1.ListJobseekerProfilesRequest) (*userv1.ListJobseekerProfilesResponse, error) {
	return s.service.ListJobseekerProfiles(ctx, req)
}

// ============================================================================
// Company RPCs
// ============================================================================

// CreateCompany creates a new company
func (s *UserServer) CreateCompany(ctx context.Context, req *userv1.CreateCompanyRequest) (*userv1.CreateCompanyResponse, error) {
	if req.Name == "" {
		return nil, status.Error(codes.InvalidArgument, "name is required")
	}

	company, err := s.service.CreateCompany(ctx, req)
	if err != nil {
		return nil, err
	}

	return &userv1.CreateCompanyResponse{Company: company}, nil
}

// GetCompany retrieves a company by ID
func (s *UserServer) GetCompany(ctx context.Context, req *userv1.GetCompanyRequest) (*userv1.GetCompanyResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}

	company, err := s.service.GetCompany(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	return &userv1.GetCompanyResponse{Company: company}, nil
}

// UpdateCompany updates a company
func (s *UserServer) UpdateCompany(ctx context.Context, req *userv1.UpdateCompanyRequest) (*userv1.UpdateCompanyResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}

	company, err := s.service.UpdateCompany(ctx, req)
	if err != nil {
		return nil, err
	}

	return &userv1.UpdateCompanyResponse{Company: company}, nil
}

// DeleteCompany deletes a company
func (s *UserServer) DeleteCompany(ctx context.Context, req *userv1.DeleteCompanyRequest) (*userv1.DeleteCompanyResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}

	err := s.service.DeleteCompany(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	return &userv1.DeleteCompanyResponse{Success: true}, nil
}

// ListCompanies lists companies with pagination and filtering
func (s *UserServer) ListCompanies(ctx context.Context, req *userv1.ListCompaniesRequest) (*userv1.ListCompaniesResponse, error) {
	return s.service.ListCompanies(ctx, req)
}

// VerifyCompany verifies or rejects a company
func (s *UserServer) VerifyCompany(ctx context.Context, req *userv1.VerifyCompanyRequest) (*userv1.VerifyCompanyResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}

	company, err := s.service.VerifyCompany(ctx, req)
	if err != nil {
		return nil, err
	}

	return &userv1.VerifyCompanyResponse{Company: company}, nil
}

// ============================================================================
// CompanyMember RPCs
// ============================================================================

// CreateCompanyMember creates a new company member
func (s *UserServer) CreateCompanyMember(ctx context.Context, req *userv1.CreateCompanyMemberRequest) (*userv1.CreateCompanyMemberResponse, error) {
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}
	if req.CompanyId == "" {
		return nil, status.Error(codes.InvalidArgument, "company_id is required")
	}

	member, err := s.service.CreateCompanyMember(ctx, req)
	if err != nil {
		return nil, err
	}

	return &userv1.CreateCompanyMemberResponse{Member: member}, nil
}

// GetCompanyMember retrieves a company member by ID
func (s *UserServer) GetCompanyMember(ctx context.Context, req *userv1.GetCompanyMemberRequest) (*userv1.GetCompanyMemberResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}

	member, err := s.service.GetCompanyMember(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	return &userv1.GetCompanyMemberResponse{Member: member}, nil
}

// GetCompanyMemberByUserId retrieves a company member by user ID
func (s *UserServer) GetCompanyMemberByUserId(ctx context.Context, req *userv1.GetCompanyMemberByUserIdRequest) (*userv1.GetCompanyMemberResponse, error) {
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}

	member, err := s.service.GetCompanyMemberByUserId(ctx, req.UserId)
	if err != nil {
		return nil, err
	}

	return &userv1.GetCompanyMemberResponse{Member: member}, nil
}

// UpdateCompanyMember updates a company member
func (s *UserServer) UpdateCompanyMember(ctx context.Context, req *userv1.UpdateCompanyMemberRequest) (*userv1.UpdateCompanyMemberResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}

	member, err := s.service.UpdateCompanyMember(ctx, req)
	if err != nil {
		return nil, err
	}

	return &userv1.UpdateCompanyMemberResponse{Member: member}, nil
}

// DeleteCompanyMember deletes a company member
func (s *UserServer) DeleteCompanyMember(ctx context.Context, req *userv1.DeleteCompanyMemberRequest) (*userv1.DeleteCompanyMemberResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}

	err := s.service.DeleteCompanyMember(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	return &userv1.DeleteCompanyMemberResponse{Success: true}, nil
}

// ListCompanyMembers lists company members with pagination and filtering
func (s *UserServer) ListCompanyMembers(ctx context.Context, req *userv1.ListCompanyMembersRequest) (*userv1.ListCompanyMembersResponse, error) {
	return s.service.ListCompanyMembers(ctx, req)
}
