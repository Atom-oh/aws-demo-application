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

type CompanyMemberRepository struct{ db *sql.DB }

func NewCompanyMemberRepository(db *sql.DB) *CompanyMemberRepository {
	return &CompanyMemberRepository{db: db}
}

func (r *CompanyMemberRepository) Create(ctx context.Context, req *userv1.CreateCompanyMemberRequest) (*userv1.CompanyMember, error) {
	query := `INSERT INTO company_members (user_id, company_id, name, position, is_primary)
		VALUES ($1, $2, $3, $4, $5) RETURNING id, user_id, company_id, name, position, is_primary, created_at`

	var m userv1.CompanyMember
	var name, position sql.NullString
	var createdAt time.Time

	err := r.db.QueryRowContext(ctx, query, req.UserId, req.CompanyId, nullString(req.Name), nullString(req.Position), req.IsPrimary,
	).Scan(&m.Id, &m.UserId, &m.CompanyId, &name, &position, &m.IsPrimary, &createdAt)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create member: %v", err)
	}

	m.Name, m.Position = name.String, position.String
	m.CreatedAt = timestamppb.New(createdAt)
	return &m, nil
}

func (r *CompanyMemberRepository) GetByID(ctx context.Context, id string) (*userv1.CompanyMember, error) {
	return r.getByField(ctx, "id", id)
}

func (r *CompanyMemberRepository) GetByUserID(ctx context.Context, userID string) (*userv1.CompanyMember, error) {
	return r.getByField(ctx, "user_id", userID)
}

func (r *CompanyMemberRepository) getByField(ctx context.Context, field, value string) (*userv1.CompanyMember, error) {
	query := fmt.Sprintf(`SELECT id, user_id, company_id, name, position, is_primary, created_at FROM company_members WHERE %s = $1`, field)

	var m userv1.CompanyMember
	var name, position sql.NullString
	var createdAt time.Time

	err := r.db.QueryRowContext(ctx, query, value).Scan(&m.Id, &m.UserId, &m.CompanyId, &name, &position, &m.IsPrimary, &createdAt)
	if err == sql.ErrNoRows {
		return nil, status.Error(codes.NotFound, "member not found")
	}
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get member: %v", err)
	}

	m.Name, m.Position = name.String, position.String
	m.CreatedAt = timestamppb.New(createdAt)
	return &m, nil
}

func (r *CompanyMemberRepository) Update(ctx context.Context, req *userv1.UpdateCompanyMemberRequest) (*userv1.CompanyMember, error) {
	query := `UPDATE company_members SET name = COALESCE($2, name), position = COALESCE($3, position),
		is_primary = COALESCE($4, is_primary) WHERE id = $1
		RETURNING id, user_id, company_id, name, position, is_primary, created_at`

	var m userv1.CompanyMember
	var name, position sql.NullString
	var createdAt time.Time

	err := r.db.QueryRowContext(ctx, query, req.Id, nullStringPtr(req.Name), nullStringPtr(req.Position), req.IsPrimary,
	).Scan(&m.Id, &m.UserId, &m.CompanyId, &name, &position, &m.IsPrimary, &createdAt)
	if err == sql.ErrNoRows {
		return nil, status.Error(codes.NotFound, "member not found")
	}
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update member: %v", err)
	}

	m.Name, m.Position = name.String, position.String
	m.CreatedAt = timestamppb.New(createdAt)
	return &m, nil
}

func (r *CompanyMemberRepository) Delete(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, `DELETE FROM company_members WHERE id = $1`, id)
	if err != nil {
		return status.Errorf(codes.Internal, "failed to delete member: %v", err)
	}
	if rows, _ := result.RowsAffected(); rows == 0 {
		return status.Error(codes.NotFound, "member not found")
	}
	return nil
}

func (r *CompanyMemberRepository) List(ctx context.Context, req *userv1.ListCompanyMembersRequest) (*userv1.ListCompanyMembersResponse, error) {
	var conds []string
	var args []interface{}
	idx := 1

	if req.CompanyId != nil {
		conds = append(conds, fmt.Sprintf("company_id = $%d", idx))
		args = append(args, *req.CompanyId)
		idx++
	}
	if req.IsPrimary != nil {
		conds = append(conds, fmt.Sprintf("is_primary = $%d", idx))
		args = append(args, *req.IsPrimary)
		idx++
	}

	where := ""
	if len(conds) > 0 {
		where = "WHERE " + strings.Join(conds, " AND ")
	}

	var total int64
	r.db.QueryRowContext(ctx, fmt.Sprintf("SELECT COUNT(*) FROM company_members %s", where), args...).Scan(&total)

	page, pageSize := int32(1), int32(20)
	if req.Pagination != nil {
		if req.Pagination.Page > 0 {
			page = req.Pagination.Page
		}
		if req.Pagination.PageSize > 0 {
			pageSize = req.Pagination.PageSize
		}
	}

	query := fmt.Sprintf(`SELECT id, user_id, company_id, name, position, is_primary, created_at
		FROM company_members %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, where, idx, idx+1)
	args = append(args, pageSize, (page-1)*pageSize)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list members: %v", err)
	}
	defer rows.Close()

	var members []*userv1.CompanyMember
	for rows.Next() {
		var m userv1.CompanyMember
		var name, position sql.NullString
		var createdAt time.Time
		rows.Scan(&m.Id, &m.UserId, &m.CompanyId, &name, &position, &m.IsPrimary, &createdAt)
		m.Name, m.Position = name.String, position.String
		m.CreatedAt = timestamppb.New(createdAt)
		members = append(members, &m)
	}

	return &userv1.ListCompanyMembersResponse{
		Members:    members,
		Pagination: &commonv1.PaginationResponse{Page: page, PageSize: pageSize, Total: total, TotalPages: int32((total + int64(pageSize) - 1) / int64(pageSize))},
	}, nil
}
