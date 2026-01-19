'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { JOBS, CATEGORIES, EXPERIENCE_LEVELS, LOCATIONS } from '../data/jobs';
import styles from './jobs.module.css';
import pageStyles from '../page.module.css';

export default function JobsPage() {
  const [category, setCategory] = useState('전체');
  const [experience, setExperience] = useState('전체');
  const [location, setLocation] = useState('전체');
  const [search, setSearch] = useState('');

  const filteredJobs = useMemo(() => {
    return JOBS.filter(job => {
      if (category !== '전체' && job.category !== category) return false;
      if (location !== '전체' && !job.location.includes(location)) return false;
      if (search && !job.title.toLowerCase().includes(search.toLowerCase()) &&
          !job.company.toLowerCase().includes(search.toLowerCase()) &&
          !job.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [category, experience, location, search]);

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
            <h1 className={styles.pageTitle}>채용공고</h1>
            <p className={styles.pageSubtitle}>AI가 추천하는 최적의 포지션을 찾아보세요</p>
          </div>
        </div>

        <div className={styles.filterSection}>
          <div className="container">
            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>직군</label>
                <select className={styles.filterSelect} value={category} onChange={e => setCategory(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>경력</label>
                <select className={styles.filterSelect} value={experience} onChange={e => setExperience(e.target.value)}>
                  {EXPERIENCE_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>지역</label>
                <select className={styles.filterSelect} value={location} onChange={e => setLocation(e.target.value)}>
                  {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="검색어를 입력하세요"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <section className={styles.resultsSection}>
          <div className="container">
            <div className={styles.resultsHeader}>
              <p className={styles.resultsCount}>총 <strong>{filteredJobs.length}</strong>개의 채용공고</p>
            </div>

            {filteredJobs.length > 0 ? (
              <div className={styles.jobsGrid}>
                {filteredJobs.map(job => (
                  <Link href={`/jobs/${job.id}`} key={job.id} className={styles.jobCard}>
                    <div className={styles.jobCardTop}>
                      <div className={styles.companyLogo}>{job.logo}</div>
                      <span className={styles.categoryBadge}>{job.category}</span>
                    </div>
                    <h3 className={styles.jobTitle}>{job.title}</h3>
                    <p className={styles.companyInfo}>
                      <span>{job.company}</span>
                      <span>· {job.team}</span>
                    </p>
                    <div className={styles.jobMeta}>
                      <span className={styles.metaItem}>📍 {job.location}</span>
                      <span className={styles.metaItem}>💼 {job.experience}</span>
                      <span className={styles.metaItem}>📋 {job.type}</span>
                    </div>
                    <div className={styles.jobTags}>
                      {job.tags.map(tag => <span key={tag} className={styles.tag}>{tag}</span>)}
                    </div>
                    <div className={styles.jobFooter}>
                      <span className={styles.salary}>{job.salary}</span>
                      <span className={styles.deadline}>마감: {job.deadline}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <h3>검색 결과가 없습니다</h3>
                <p>다른 조건으로 검색해보세요</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className={pageStyles.footer}>
        <div className="container">
          <div className={pageStyles.footerBottom}>
            <p className={pageStyles.copyright}>© 2026 HireHub. All rights reserved.</p>
            <div className={pageStyles.apiStatus}><span className={pageStyles.statusDot}></span>System Operational</div>
          </div>
        </div>
      </footer>
    </>
  );
}
