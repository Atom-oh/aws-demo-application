package service

import (
	"context"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"github.com/hirehub/services/user-service/internal/repository"
	userv1 "github.com/hirehub/proto/user/v1"
)

// UserService handles business logic for user operations
type UserService struct {
	userRepo             *repository.UserRepository
	jobseekerProfileRepo *repository.JobseekerProfileRepository
	companyRepo          *repository.CompanyRepository
	companyMemberRepo    *repository.CompanyMemberRepository
}

// NewUserService creates a new UserService instance
func NewUserService(
	userRepo *repository.UserRepository,
	jobseekerProfileRepo *repository.JobseekerProfileRepository,
	companyRepo *repository.CompanyRepository,
	companyMemberRepo *repository.CompanyMemberRepository,
) *UserService {
	return &UserService{
		userRepo:             userRepo,
		jobseekerProfileRepo: jobseekerProfileRepo,
		companyRepo:          companyRepo,
		companyMemberRepo:    companyMemberRepo,
	}
}

// ============================================================================
// User Methods
// ============================================================================

func (s *UserService) CreateUser(ctx context.Context, req *userv1.CreateUserRequest) (*userv1.User, error) {
	return s.userRepo.Create(ctx, req)
}

func (s *UserService) GetUser(ctx context.Context, id string) (*userv1.User, error) {
	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return s.enrichUserProfile(ctx, user)
}

func (s *UserService) GetUserByCognitoSub(ctx context.Context, cognitoSub string) (*userv1.User, error) {
	user, err := s.userRepo.GetByCognitoSub(ctx, cognitoSub)
	if err != nil {
		return nil, err
	}
	return s.enrichUserProfile(ctx, user)
}

func (s *UserService) GetUserByEmail(ctx context.Context, email string) (*userv1.User, error) {
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	return s.enrichUserProfile(ctx, user)
}

func (s *UserService) UpdateUser(ctx context.Context, req *userv1.UpdateUserRequest) (*userv1.User, error) {
	return s.userRepo.Update(ctx, req)
}

func (s *UserService) DeleteUser(ctx context.Context, id string) error {
	return s.userRepo.Delete(ctx, id)
}

func (s *UserService) ListUsers(ctx context.Context, req *userv1.ListUsersRequest) (*userv1.ListUsersResponse, error) {
	return s.userRepo.List(ctx, req)
}

func (s *UserService) enrichUserProfile(ctx context.Context, user *userv1.User) (*userv1.User, error) {
	switch user.UserType {
	case userv1.UserType_USER_TYPE_JOBSEEKER:
		profile, err := s.jobseekerProfileRepo.GetByUserID(ctx, user.Id)
		if err == nil && profile != nil {
			user.Profile = &userv1.User_JobseekerProfile{JobseekerProfile: profile}
		}
	case userv1.UserType_USER_TYPE_COMPANY_MEMBER:
		member, err := s.companyMemberRepo.GetByUserID(ctx, user.Id)
		if err == nil && member != nil {
			user.Profile = &userv1.User_CompanyMember{CompanyMember: member}
		}
	}
	return user, nil
}

// ============================================================================
// JobseekerProfile Methods
// ============================================================================

func (s *UserService) CreateJobseekerProfile(ctx context.Context, req *userv1.CreateJobseekerProfileRequest) (*userv1.JobseekerProfile, error) {
	user, err := s.userRepo.GetByID(ctx, req.UserId)
	if err != nil {
		return nil, err
	}
	if user.UserType != userv1.UserType_USER_TYPE_JOBSEEKER {
		return nil, status.Error(codes.InvalidArgument, "user is not a jobseeker")
	}
	return s.jobseekerProfileRepo.Create(ctx, req)
}

func (s *UserService) GetJobseekerProfile(ctx context.Context, id string) (*userv1.JobseekerProfile, error) {
	return s.jobseekerProfileRepo.GetByID(ctx, id)
}

func (s *UserService) GetJobseekerProfileByUserId(ctx context.Context, userID string) (*userv1.JobseekerProfile, error) {
	return s.jobseekerProfileRepo.GetByUserID(ctx, userID)
}

func (s *UserService) UpdateJobseekerProfile(ctx context.Context, req *userv1.UpdateJobseekerProfileRequest) (*userv1.JobseekerProfile, error) {
	return s.jobseekerProfileRepo.Update(ctx, req)
}

func (s *UserService) ListJobseekerProfiles(ctx context.Context, req *userv1.ListJobseekerProfilesRequest) (*userv1.ListJobseekerProfilesResponse, error) {
	return s.jobseekerProfileRepo.List(ctx, req)
}

// ============================================================================
// Company Methods
// ============================================================================

func (s *UserService) CreateCompany(ctx context.Context, req *userv1.CreateCompanyRequest) (*userv1.Company, error) {
	return s.companyRepo.Create(ctx, req)
}

func (s *UserService) GetCompany(ctx context.Context, id string) (*userv1.Company, error) {
	return s.companyRepo.GetByID(ctx, id)
}

func (s *UserService) UpdateCompany(ctx context.Context, req *userv1.UpdateCompanyRequest) (*userv1.Company, error) {
	return s.companyRepo.Update(ctx, req)
}

func (s *UserService) DeleteCompany(ctx context.Context, id string) error {
	return s.companyRepo.Delete(ctx, id)
}

func (s *UserService) ListCompanies(ctx context.Context, req *userv1.ListCompaniesRequest) (*userv1.ListCompaniesResponse, error) {
	return s.companyRepo.List(ctx, req)
}

func (s *UserService) VerifyCompany(ctx context.Context, req *userv1.VerifyCompanyRequest) (*userv1.Company, error) {
	return s.companyRepo.Verify(ctx, req)
}

// ============================================================================
// CompanyMember Methods
// ============================================================================

func (s *UserService) CreateCompanyMember(ctx context.Context, req *userv1.CreateCompanyMemberRequest) (*userv1.CompanyMember, error) {
	user, err := s.userRepo.GetByID(ctx, req.UserId)
	if err != nil {
		return nil, err
	}
	if user.UserType != userv1.UserType_USER_TYPE_COMPANY_MEMBER {
		return nil, status.Error(codes.InvalidArgument, "user is not a company member")
	}
	_, err = s.companyRepo.GetByID(ctx, req.CompanyId)
	if err != nil {
		return nil, err
	}
	return s.companyMemberRepo.Create(ctx, req)
}

func (s *UserService) GetCompanyMember(ctx context.Context, id string) (*userv1.CompanyMember, error) {
	return s.companyMemberRepo.GetByID(ctx, id)
}

func (s *UserService) GetCompanyMemberByUserId(ctx context.Context, userID string) (*userv1.CompanyMember, error) {
	return s.companyMemberRepo.GetByUserID(ctx, userID)
}

func (s *UserService) UpdateCompanyMember(ctx context.Context, req *userv1.UpdateCompanyMemberRequest) (*userv1.CompanyMember, error) {
	return s.companyMemberRepo.Update(ctx, req)
}

func (s *UserService) DeleteCompanyMember(ctx context.Context, id string) error {
	return s.companyMemberRepo.Delete(ctx, id)
}

func (s *UserService) ListCompanyMembers(ctx context.Context, req *userv1.ListCompanyMembersRequest) (*userv1.ListCompanyMembersResponse, error) {
	return s.companyMemberRepo.List(ctx, req)
}
