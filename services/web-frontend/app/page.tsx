import styles from './page.module.css';

const JOBS = [
  { id: 1, title: 'Senior Frontend Developer', company: 'Naver', location: '판교', type: '정규직', salary: '8,000만원~1억', tags: ['React', 'TypeScript'], logo: 'N' },
  { id: 2, title: 'Backend Engineer', company: 'Kakao', location: '판교', type: '정규직', salary: '7,000만원~9,000만원', tags: ['Java', 'Spring'], logo: 'K' },
  { id: 3, title: 'AI/ML Engineer', company: 'Samsung SDS', location: '서울', type: '정규직', salary: '9,000만원~1.2억', tags: ['Python', 'PyTorch', 'AI'], logo: 'S' },
  { id: 4, title: 'DevOps Engineer', company: 'Coupang', location: '서울', type: '정규직', salary: '8,000만원~1.1억', tags: ['AWS', 'Kubernetes'], logo: 'C' },
];

export default function Home() {
  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>Hire<span className={styles.logoAccent}>Hub</span></div>
          <nav className={styles.nav}>
            <a href="/jobs" className={styles.navLink}>채용공고</a>
            <a href="/companies" className={styles.navLink}>기업정보</a>
            <a href="/salary" className={styles.navLink}>연봉정보</a>
            <a href="/ai-match" className={styles.navLink}>AI 매칭</a>
          </nav>
          <div className={styles.navActions}>
            <button className={styles.btnSecondary}>로그인</button>
            <button className={styles.btnPrimary}>회원가입</button>
          </div>
        </div>
      </header>

      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <span className={styles.heroTag}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              AI 기반 맞춤 채용 플랫폼
            </span>
            <h1 className={styles.heroTitle}>당신의 커리어,<br/>AI가 함께합니다</h1>
            <p className={styles.heroSubtitle}>AI 매칭으로 나에게 딱 맞는 채용공고를 찾아보세요</p>
            <div className={styles.searchBox}>
              <div className={styles.searchField}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input type="text" placeholder="직무, 기업명, 키워드로 검색" />
              </div>
              <div className={styles.searchField}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <input type="text" placeholder="지역" />
              </div>
              <button className={styles.searchBtn}>검색</button>
            </div>
            <div className={styles.popularSearches}>
              <span className={styles.popularLabel}>인기 검색:</span>
              {['프론트엔드', '백엔드', 'AI/ML', '데이터분석', 'DevOps'].map(tag => (
                <span key={tag} className={styles.popularTag}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.stats}>
        <div className="container">
          <div className={styles.statsGrid}>
            <div className={styles.statItem}><div className={styles.statNumber}>15,000+</div><div className={styles.statLabel}>채용공고</div></div>
            <div className={styles.statItem}><div className={styles.statNumber}>3,500+</div><div className={styles.statLabel}>파트너 기업</div></div>
            <div className={styles.statItem}><div className={styles.statNumber}>50,000+</div><div className={styles.statLabel}>가입 회원</div></div>
            <div className={styles.statItem}><div className={styles.statNumber}>95%</div><div className={styles.statLabel}>AI 매칭 정확도</div></div>
          </div>
        </div>
      </section>

      <section className={styles.jobsSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>추천 채용공고</h2>
            <a href="/jobs" className={styles.viewAllLink}>전체보기 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg></a>
          </div>
          <div className={styles.jobsGrid}>
            {JOBS.map(job => (
              <div key={job.id} className={styles.jobCard}>
                <div className={styles.jobCardHeader}>
                  <div className={styles.companyLogo}>{job.logo}</div>
                  <button className={styles.saveBtn}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></button>
                </div>
                <h3 className={styles.jobTitle}>{job.title}</h3>
                <p className={styles.companyName}>{job.company}</p>
                <div className={styles.jobMeta}>
                  <span className={styles.jobMetaItem}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>{job.location}</span>
                  <span className={styles.jobMetaItem}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>{job.type}</span>
                  <span className={styles.jobMetaItem}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>{job.salary}</span>
                </div>
                <div className={styles.jobTags}>
                  {job.tags.map((tag, i) => <span key={tag} className={`${styles.jobTag} ${i === 0 ? styles.jobTagHighlight : ''}`}>{tag}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <div className="container">
          <h2 className={styles.featuresTitle}>HireHub만의 특별한 기능</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M20 12a8 8 0 0 0-8-8v8h8z"/></svg></div>
              <h3 className={styles.featureTitle}>AI 스마트 매칭</h3>
              <p className={styles.featureDesc}>이력서와 채용공고를 AI가 분석하여 최적의 매칭을 제공합니다</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
              <h3 className={styles.featureTitle}>개인정보 보호</h3>
              <p className={styles.featureDesc}>AI 기반 PII 자동 제거로 개인정보를 안전하게 보호합니다</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
              <h3 className={styles.featureTitle}>AI 면접 코칭</h3>
              <p className={styles.featureDesc}>RAG 기반 Q&A로 면접 준비를 도와드립니다</p>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <div className={styles.footerLogo}>HireHub</div>
              <p className={styles.footerDesc}>AI 기반 맞춤 채용 플랫폼으로 최고의 인재와 기업을 연결합니다</p>
            </div>
            <div className={styles.footerLinks}>
              <div className={styles.footerCol}><h4>서비스</h4><ul><li><a href="#">채용공고</a></li><li><a href="#">기업정보</a></li><li><a href="#">AI 매칭</a></li></ul></div>
              <div className={styles.footerCol}><h4>고객지원</h4><ul><li><a href="#">FAQ</a></li><li><a href="#">문의하기</a></li><li><a href="#">이용약관</a></li></ul></div>
              <div className={styles.footerCol}><h4>회사</h4><ul><li><a href="#">회사소개</a></li><li><a href="#">채용</a></li><li><a href="#">블로그</a></li></ul></div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p className={styles.copyright}>© 2026 HireHub. All rights reserved.</p>
            <div className={styles.apiStatus}><span className={styles.statusDot}></span>System Operational</div>
          </div>
        </div>
      </footer>
    </>
  );
}
