'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { COMPANIES, INDUSTRIES, COMPANY_SIZES } from '../data/companies';
import styles from './companies.module.css';
import pageStyles from '../page.module.css';

export default function CompaniesPage() {
  const [industry, setIndustry] = useState('전체');
  const [size, setSize] = useState('전체');
  const [search, setSearch] = useState('');

  const filteredCompanies = useMemo(() => {
    return COMPANIES.filter(company => {
      if (industry !== '전체' && company.industry !== industry) return false;
      if (size !== '전체' && company.size !== size) return false;
      if (search && !company.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [industry, size, search]);

  return (
    <>
      <header className={pageStyles.header}>
        <div className={pageStyles.headerInner}>
          <Link href="/" className={pageStyles.logo}>Hire<span className={pageStyles.logoAccent}>Hub</span></Link>
          <nav className={pageStyles.nav}>
            <Link href="/jobs" className={pageStyles.navLink}>채용공고</Link>
            <Link href="/companies" className={pageStyles.navLink}>기업정보</Link>
            <Link href="/salary" className={pageStyles.navLink}>연봉정보</Link>
            <Link href="/ai-match" className={pageStyles.navLink}>AI 매칭</Link>
          </nav>
          <div className={pageStyles.navActions}>
            <button className={pageStyles.btnSecondary}>로그인</button>
            <button className={pageStyles.btnPrimary}>회원가입</button>
          </div>
        </div>
      </header>

      <main className={styles.page}>
        <div className={styles.pageHeader}>
          <div className="container">
            <h1 className={styles.pageTitle}>기업정보</h1>
            <p className={styles.pageSubtitle}>관심 있는 기업의 문화와 복지를 확인하세요</p>
          </div>
        </div>

        <div className={styles.filterSection}>
          <div className="container">
            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>산업</label>
                <select className={styles.filterSelect} value={industry} onChange={e => setIndustry(e.target.value)}>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>규모</label>
                <select className={styles.filterSelect} value={size} onChange={e => setSize(e.target.value)}>
                  {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="기업명 검색"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <section className={styles.resultsSection}>
          <div className="container">
            <p className={styles.resultsCount}>총 <strong>{filteredCompanies.length}</strong>개 기업</p>

            <div className={styles.companiesGrid}>
              {filteredCompanies.map(company => (
                <div key={company.id} className={styles.companyCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.companyLogo}>{company.logo}</div>
                    <div className={styles.companyMeta}>
                      <h3 className={styles.companyName}>{company.name}</h3>
                      <p className={styles.companyIndustry}>{company.industry} · {company.size}</p>
                    </div>
                    <div className={styles.rating}>
                      <span className={styles.ratingScore}>★ {company.rating}</span>
                      <span className={styles.reviewCount}>{company.reviews}개 리뷰</span>
                    </div>
                  </div>

                  <p className={styles.companyDesc}>{company.description}</p>

                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>📍 위치</span>
                      <span className={styles.infoValue}>{company.location}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>💰 평균연봉</span>
                      <span className={styles.infoValue}>{company.avgSalary}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>📋 채용중</span>
                      <span className={styles.infoValue}>{company.openPositions}개 포지션</span>
                    </div>
                  </div>

                  <div className={styles.benefits}>
                    <span className={styles.benefitLabel}>복지:</span>
                    {company.benefits.slice(0, 3).map(b => (
                      <span key={b} className={styles.benefitTag}>{b}</span>
                    ))}
                    {company.benefits.length > 3 && <span className={styles.moreTag}>+{company.benefits.length - 3}</span>}
                  </div>

                  <div className={styles.techStack}>
                    {company.techStack.map(tech => (
                      <span key={tech} className={styles.techTag}>{tech}</span>
                    ))}
                  </div>

                  <div className={styles.cardActions}>
                    <Link href={`/jobs?company=${company.name}`} className={styles.viewJobsBtn}>
                      채용공고 보기 ({company.openPositions})
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className={pageStyles.footer}>
        <div className="container">
          <div className={pageStyles.footerBottom}>
            <p className={pageStyles.copyright}>© 2026 HireHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
