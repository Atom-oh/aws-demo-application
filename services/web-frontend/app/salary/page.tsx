'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { SALARY_DATA, POSITIONS, EXPERIENCE_LEVELS } from '../data/salaries';
import styles from './salary.module.css';
import pageStyles from '../page.module.css';

export default function SalaryPage() {
  const [position, setPosition] = useState('전체');
  const [experience, setExperience] = useState('전체');

  const filteredData = useMemo(() => {
    return SALARY_DATA.filter(item => {
      if (position !== '전체' && item.position !== position) return false;
      if (experience !== '전체' && item.experience !== experience) return false;
      return true;
    });
  }, [position, experience]);

  const formatSalary = (val: number) => {
    if (val >= 10000) return `${(val / 10000).toFixed(1)}억`;
    return `${val.toLocaleString()}만원`;
  };

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
            <h1 className={styles.pageTitle}>연봉정보</h1>
            <p className={styles.pageSubtitle}>직무별, 경력별 시장 연봉을 확인하세요</p>
          </div>
        </div>

        <div className={styles.filterSection}>
          <div className="container">
            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>직무</label>
                <select className={styles.filterSelect} value={position} onChange={e => setPosition(e.target.value)}>
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>경력</label>
                <select className={styles.filterSelect} value={experience} onChange={e => setExperience(e.target.value)}>
                  {EXPERIENCE_LEVELS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <section className={styles.resultsSection}>
          <div className="container">
            <div className={styles.infoBox}>
              <span className={styles.infoIcon}>ℹ️</span>
              <p>연봉 데이터는 HireHub 사용자들의 익명 제보를 기반으로 합니다. (단위: 만원, 세전 기준)</p>
            </div>

            <div className={styles.salaryTable}>
              <div className={styles.tableHeader}>
                <div className={styles.colPosition}>직무</div>
                <div className={styles.colExperience}>경력</div>
                <div className={styles.colAvg}>평균 연봉</div>
                <div className={styles.colRange}>연봉 범위</div>
                <div className={styles.colSamples}>샘플 수</div>
              </div>

              {filteredData.map((item, idx) => (
                <div key={idx} className={styles.tableRow}>
                  <div className={styles.colPosition}>
                    <span className={styles.positionName}>{item.position}</span>
                    <span className={styles.category}>{item.category}</span>
                  </div>
                  <div className={styles.colExperience}>{item.experience}</div>
                  <div className={styles.colAvg}>
                    <span className={styles.avgSalary}>{formatSalary(item.avgSalary)}</span>
                  </div>
                  <div className={styles.colRange}>
                    <div className={styles.rangeBar}>
                      <div
                        className={styles.rangeFill}
                        style={{
                          left: `${((item.minSalary - 3000) / 15000) * 100}%`,
                          width: `${((item.maxSalary - item.minSalary) / 15000) * 100}%`
                        }}
                      />
                      <div
                        className={styles.avgDot}
                        style={{ left: `${((item.avgSalary - 3000) / 15000) * 100}%` }}
                      />
                    </div>
                    <div className={styles.rangeValues}>
                      <span>{formatSalary(item.minSalary)}</span>
                      <span>{formatSalary(item.maxSalary)}</span>
                    </div>
                  </div>
                  <div className={styles.colSamples}>{item.samples}건</div>
                </div>
              ))}
            </div>

            {filteredData.length === 0 && (
              <div className={styles.emptyState}>
                <p>해당 조건의 연봉 데이터가 없습니다.</p>
              </div>
            )}
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
