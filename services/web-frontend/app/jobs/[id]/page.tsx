import Link from 'next/link';
import { JOBS } from '../../data/jobs';
import styles from './detail.module.css';
import pageStyles from '../../page.module.css';
import ApplyButton from '../../components/ApplyButton';

export function generateStaticParams() {
  return JOBS.map(job => ({ id: String(job.id) }));
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = JOBS.find(j => j.id === parseInt(id));

  if (!job) {
    return (
      <>
        <header className={pageStyles.header}>
          <div className={pageStyles.headerInner}>
            <Link href="/" className={pageStyles.logo}>Hire<span className={pageStyles.logoAccent}>Hub</span></Link>
          </div>
        </header>
        <main className={styles.page}>
          <div className={styles.notFound}>
            <h2>채용공고를 찾을 수 없습니다</h2>
            <Link href="/jobs">목록으로 돌아가기</Link>
          </div>
        </main>
      </>
    );
  }

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
            <Link href="/jobs" className={styles.backLink}>← 목록으로</Link>
            <div className={styles.headerContent}>
              <div className={styles.companyLogo}>{job.logo}</div>
              <div className={styles.headerInfo}>
                <span className={styles.categoryBadge}>{job.category}</span>
                <h1 className={styles.jobTitle}>{job.title}</h1>
                <p className={styles.companyName}>{job.company} · {job.team}</p>
                <div className={styles.headerMeta}>
                  <span className={styles.metaItem}>📍 {job.location}</span>
                  <span className={styles.metaItem}>💼 {job.experience}</span>
                  <span className={styles.metaItem}>📋 {job.type}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className={styles.contentSection}>
          <div className="container">
            <div className={styles.contentGrid}>
              <div className={styles.mainContent}>
                <div className={styles.card}>
                  <h2 className={styles.cardTitle}>포지션 소개</h2>
                  <p className={styles.description}>{job.description}</p>
                </div>

                <div className={styles.card}>
                  <h2 className={styles.cardTitle}>자격 요건</h2>
                  <ul className={styles.requirementsList}>
                    {job.requirements.map((req, i) => <li key={i}>{req}</li>)}
                  </ul>
                </div>

                <div className={styles.card}>
                  <h2 className={styles.cardTitle}>우대 사항</h2>
                  <ul className={`${styles.requirementsList} ${styles.preferredList}`}>
                    {job.preferred.map((pref, i) => <li key={i}>{pref}</li>)}
                  </ul>
                </div>

                <div className={styles.card}>
                  <h2 className={styles.cardTitle}>기술 스택</h2>
                  <div className={styles.techTags}>
                    {job.tags.map(tag => <span key={tag} className={styles.techTag}>{tag}</span>)}
                  </div>
                </div>
              </div>

              <aside className={styles.sidebar}>
                <div className={styles.applyCard}>
                  <div className={styles.salaryInfo}>
                    <p className={styles.salaryLabel}>연봉</p>
                    <p className={styles.salaryValue}>{job.salary}</p>
                  </div>
                  <div className={styles.deadlineInfo}>
                    📅 마감일: {job.deadline}
                  </div>
                  <ApplyButton className={styles.applyBtn} jobTitle={job.title} company={job.company} />
                  <button className={styles.saveBtn}>관심 등록</button>
                </div>
              </aside>
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
