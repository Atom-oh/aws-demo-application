package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	commonv1 "github.com/hirehub/proto/common/v1"
	userv1 "github.com/hirehub/proto/user/v1"
)

type CompanyRepository struct{ db *sql.DB }

func NewCompanyRepository(db *sql.DB) *CompanyRepository { return &CompanyRepository{db: db} }

func (r *CompanyRepository) Create(ctx context.Context, req *userv1.CreateCompanyRequest) (*userv1.Company, error) {
	query := `INSERT INTO companies (name, business_number, industry, company_size, location, logo_url, description)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, name, business_number, industry, company_size, location, logo_url, description, status, created_at, updated_at`

	var c userv1.Company
	var bizNum, industry, size, location, logo, desc, stat sql.NullString
	var createdAt, updatedAt time.Time

	err := r.db.QueryRowContext(ctx, query, req.Name, nullString(req.BusinessNumber), nullString(req.Industry),
		companySizeToString(req.CompanySize), nullString(req.Location), nullString(req.LogoUrl), nullString(req.Description),
	).Scan(&c.Id, &c.Name, &bizNum, &industry, &size, &location, &logo, &desc, &stat, &createdAt, &updatedAt)
	if err != nil {
		if isUniqueViolation(err) {
			return nil, status.Error(codes.AlreadyExists, "company already exists")
		}
		return nil, status.Errorf(codes.Internal, "failed to create company: %v", err)
	}

	c.BusinessNumber, c.Industry, c.Location, c.LogoUrl, c.Description = bizNum.String, industry.String, location.String, logo.String, desc.String
	c.CompanySize, c.Status = stringToCompanySize(size.String), stringToCompanyStatus(stat.String)
	c.CreatedAt, c.UpdatedAt = timestamppb.New(createdAt), timestamppb.New(updatedAt)
	return &c, nil
}

func (r *CompanyRepository) GetByID(ctx context.Context, id string) (*userv1.Company, error) {
	query := `SELECT id, name, business_number, industry, company_size, location, logo_url, description, status, created_at, updated_at FROM companies WHERE id = $1`
	var c userv1.Company
	var bizNum, industry, size, location, logo, desc, stat sql.NullString
	var createdAt, updatedAt time.Time

	err := r.db.QueryRowContext(ctx, query, id).Scan(&c.Id, &c.Name, &bizNum, &industry, &size, &location, &logo, &desc, &stat, &createdAt, &updatedAt)
	if err == sql.ErrNoRows {
		return nil, status.Error(codes.NotFound, "company not found")
	}
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get company: %v", err)
	}

	c.BusinessNumber, c.Industry, c.Location, c.LogoUrl, c.Description = bizNum.String, industry.String, location.String, logo.String, desc.String
	c.CompanySize, c.Status = stringToCompanySize(size.String), stringToCompanyStatus(stat.String)
	c.CreatedAt, c.UpdatedAt = timestamppb.New(createdAt), timestamppb.New(updatedAt)
	return &c, nil
}

func (r *CompanyRepository) Update(ctx context.Context, req *userv1.UpdateCompanyRequest) (*userv1.Company, error) {
	query := `UPDATE companies SET name = COALESCE($2, name), industry = COALESCE($3, industry),
		company_size = COALESCE($4, company_size), location = COALESCE($5, location), logo_url = COALESCE($6, logo_url),
		description = COALESCE($7, description), status = COALESCE($8, status), updated_at = CURRENT_TIMESTAMP WHERE id = $1
		RETURNING id, name, business_number, industry, company_size, location, logo_url, description, status, created_at, updated_at`

	var sizeStr, statusStr *string
	if req.CompanySize != nil {
		s := companySizeToString(*req.CompanySize)
		sizeStr = &s
	}
	if req.Status != nil {
		s := companyStatusToString(*req.Status)
		statusStr = &s
	}

	var c userv1.Company
	var bizNum, industry, size, location, logo, desc, stat sql.NullString
	var createdAt, updatedAt time.Time

	err := r.db.QueryRowContext(ctx, query, req.Id, nullStringPtr(req.Name), nullStringPtr(req.Industry),
		sizeStr, nullStringPtr(req.Location), nullStringPtr(req.LogoUrl), nullStringPtr(req.Description), statusStr,
	).Scan(&c.Id, &c.Name, &bizNum, &industry, &size, &location, &logo, &desc, &stat, &createdAt, &updatedAt)
	if err == sql.ErrNoRows {
		return nil, status.Error(codes.NotFound, "company not found")
	}
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update company: %v", err)
	}

	c.BusinessNumber, c.Industry, c.Location, c.LogoUrl, c.Description = bizNum.String, industry.String, location.String, logo.String, desc.String
	c.CompanySize, c.Status = stringToCompanySize(size.String), stringToCompanyStatus(stat.String)
	c.CreatedAt, c.UpdatedAt = timestamppb.New(createdAt), timestamppb.New(updatedAt)
	return &c, nil
}

func (r *CompanyRepository) Delete(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, `DELETE FROM companies WHERE id = $1`, id)
	if err != nil {
		return status.Errorf(codes.Internal, "failed to delete company: %v", err)
	}
	if rows, _ := result.RowsAffected(); rows == 0 {
		return status.Error(codes.NotFound, "company not found")
	}
	return nil
}

func (r *CompanyRepository) List(ctx context.Context, req *userv1.ListCompaniesRequest) (*userv1.ListCompaniesResponse, error) {
	var conds []string
	var args []interface{}
	idx := 1

	if req.NameContains != nil {
		conds = append(conds, fmt.Sprintf("name ILIKE $%d", idx))
		args = append(args, "%"+*req.NameContains+"%")
		idx++
	}
	if req.Industry != nil {
		conds = append(conds, fmt.Sprintf("industry = $%d", idx))
		args = append(args, *req.Industry)
		idx++
	}
	if req.CompanySize != nil && *req.CompanySize != userv1.CompanySize_COMPANY_SIZE_UNSPECIFIED {
		conds = append(conds, fmt.Sprintf("company_size = $%d", idx))
		args = append(args, companySizeToString(*req.CompanySize))
		idx++
	}
	if req.Status != nil && *req.Status != userv1.CompanyStatus_COMPANY_STATUS_UNSPECIFIED {
		conds = append(conds, fmt.Sprintf("status = $%d", idx))
		args = append(args, companyStatusToString(*req.Status))
		idx++
	}

	where := ""
	if len(conds) > 0 {
		where = "WHERE " + strings.Join(conds, " AND ")
	}

	var total int64
	r.db.QueryRowContext(ctx, fmt.Sprintf("SELECT COUNT(*) FROM companies %s", where), args...).Scan(&total)

	page, pageSize := int32(1), int32(20)
	if req.Pagination != nil {
		if req.Pagination.Page > 0 {
			page = req.Pagination.Page
		}
		if req.Pagination.PageSize > 0 {
			pageSize = req.Pagination.PageSize
		}
	}

	query := fmt.Sprintf(`SELECT id, name, business_number, industry, company_size, location, logo_url, description, status, created_at, updated_at
		FROM companies %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, where, idx, idx+1)
	args = append(args, pageSize, (page-1)*pageSize)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list companies: %v", err)
	}
	defer rows.Close()

	var companies []*userv1.Company
	for rows.Next() {
		var c userv1.Company
		var bizNum, industry, size, location, logo, desc, stat sql.NullString
		var createdAt, updatedAt time.Time
		rows.Scan(&c.Id, &c.Name, &bizNum, &industry, &size, &location, &logo, &desc, &stat, &createdAt, &updatedAt)
		c.BusinessNumber, c.Industry, c.Location, c.LogoUrl, c.Description = bizNum.String, industry.String, location.String, logo.String, desc.String
		c.CompanySize, c.Status = stringToCompanySize(size.String), stringToCompanyStatus(stat.String)
		c.CreatedAt, c.UpdatedAt = timestamppb.New(createdAt), timestamppb.New(updatedAt)
		companies = append(companies, &c)
	}

	return &userv1.ListCompaniesResponse{
		Companies:  companies,
		Pagination: &commonv1.PaginationResponse{Page: page, PageSize: pageSize, Total: total, TotalPages: int32((total + int64(pageSize) - 1) / int64(pageSize))},
	}, nil
}

func (r *CompanyRepository) Verify(ctx context.Context, req *userv1.VerifyCompanyRequest) (*userv1.Company, error) {
	stat := "verified"
	if !req.Approved {
		stat = "rejected"
	}
	query := `UPDATE companies SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1
		RETURNING id, name, business_number, industry, company_size, location, logo_url, description, status, created_at, updated_at`

	var c userv1.Company
	var bizNum, industry, size, location, logo, desc, compStatus sql.NullString
	var createdAt, updatedAt time.Time

	err := r.db.QueryRowContext(ctx, query, req.Id, stat).Scan(&c.Id, &c.Name, &bizNum, &industry, &size, &location, &logo, &desc, &compStatus, &createdAt, &updatedAt)
	if err == sql.ErrNoRows {
		return nil, status.Error(codes.NotFound, "company not found")
	}
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to verify company: %v", err)
	}

	c.BusinessNumber, c.Industry, c.Location, c.LogoUrl, c.Description = bizNum.String, industry.String, location.String, logo.String, desc.String
	c.CompanySize, c.Status = stringToCompanySize(size.String), stringToCompanyStatus(compStatus.String)
	c.CreatedAt, c.UpdatedAt = timestamppb.New(createdAt), timestamppb.New(updatedAt)
	return &c, nil
}

func companySizeToString(s userv1.CompanySize) string {
	switch s {
	case userv1.CompanySize_COMPANY_SIZE_STARTUP:
		return "startup"
	case userv1.CompanySize_COMPANY_SIZE_SMALL:
		return "small"
	case userv1.CompanySize_COMPANY_SIZE_MEDIUM:
		return "medium"
	case userv1.CompanySize_COMPANY_SIZE_LARGE:
		return "large"
	case userv1.CompanySize_COMPANY_SIZE_ENTERPRISE:
		return "enterprise"
	default:
		return ""
	}
}

func stringToCompanySize(s string) userv1.CompanySize {
	switch s {
	case "startup":
		return userv1.CompanySize_COMPANY_SIZE_STARTUP
	case "small":
		return userv1.CompanySize_COMPANY_SIZE_SMALL
	case "medium":
		return userv1.CompanySize_COMPANY_SIZE_MEDIUM
	case "large":
		return userv1.CompanySize_COMPANY_SIZE_LARGE
	case "enterprise":
		return userv1.CompanySize_COMPANY_SIZE_ENTERPRISE
	default:
		return userv1.CompanySize_COMPANY_SIZE_UNSPECIFIED
	}
}

func companyStatusToString(s userv1.CompanyStatus) string {
	switch s {
	case userv1.CompanyStatus_COMPANY_STATUS_PENDING:
		return "pending"
	case userv1.CompanyStatus_COMPANY_STATUS_VERIFIED:
		return "verified"
	case userv1.CompanyStatus_COMPANY_STATUS_REJECTED:
		return "rejected"
	case userv1.CompanyStatus_COMPANY_STATUS_SUSPENDED:
		return "suspended"
	default:
		return "pending"
	}
}

func stringToCompanyStatus(s string) userv1.CompanyStatus {
	switch s {
	case "pending":
		return userv1.CompanyStatus_COMPANY_STATUS_PENDING
	case "verified":
		return userv1.CompanyStatus_COMPANY_STATUS_VERIFIED
	case "rejected":
		return userv1.CompanyStatus_COMPANY_STATUS_REJECTED
	case "suspended":
		return userv1.CompanyStatus_COMPANY_STATUS_SUSPENDED
	default:
		return userv1.CompanyStatus_COMPANY_STATUS_UNSPECIFIED
	}
}
