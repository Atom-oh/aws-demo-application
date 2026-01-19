'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './ai-match.module.css';
import pageStyles from '../page.module.css';

const SAMPLE_MATCHES = [
  { id: 1, title: 'Senior Backend Engineer', company: '토스', match: 95, reasons: ['Kotlin 5년 경험', 'MSA 아키텍처 전문성', '금융 도메인 경험'] },
  { id: 2, title: 'DevOps Engineer', company: '쿠팡', match: 89, reasons: ['AWS 인프라 경험', 'Kubernetes 운영 경험', '대규모 시스템 경험'] },
  { id: 3, title: 'Backend Developer', company: '카카오', match: 85, reasons: ['Java/Spring 전문성', '분산 시스템 경험', '코드 리뷰 문화'] },
];

export default function AIMatchPage() {
  const [step, setStep] = useState<'upload' | 'analyzing' | 'result'>('upload');
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = () => {
    setStep('analyzing');
    setTimeout(() => setStep('result'), 2000);
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
            <h1 className={styles.pageTitle}>AI 매칭</h1>
            <p className={styles.pageSubtitle}>이력서를 업로드하면 AI가 최적의 포지션을 찾아드립니다</p>
          </div>
        </div>

        <section className={styles.mainSection}>
          <div className="container">
            {step === 'upload' && (
              <div className={styles.uploadSection}>
                <div className={styles.features}>
                  <div className={styles.featureItem}>
                    <div className={styles.featureIcon}>🔒</div>
                    <h3>개인정보 보호</h3>
                    <p>AI가 자동으로 민감정보를 제거합니다</p>
                  </div>
                  <div className={styles.featureItem}>
                    <div className={styles.featureIcon}>🎯</div>
                    <h3>95% 정확도</h3>
                    <p>고도화된 AI 매칭 알고리즘</p>
                  </div>
                  <div className={styles.featureItem}>
                    <div className={styles.featureIcon}>⚡</div>
                    <h3>실시간 분석</h3>
                    <p>30초 이내 매칭 결과 제공</p>
                  </div>
                </div>

                <div
                  className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => { e.preventDefault(); setDragActive(false); handleUpload(); }}
                >
                  <div className={styles.dropzoneIcon}>📄</div>
                  <h3 className={styles.dropzoneTitle}>이력서를 업로드하세요</h3>
                  <p className={styles.dropzoneDesc}>PDF, DOCX, HWP 파일 지원 (최대 10MB)</p>
                  <button className={styles.uploadBtn} onClick={handleUpload}>파일 선택</button>
                  <p className={styles.dropzoneHint}>또는 파일을 여기에 드래그하세요</p>
                </div>

                <div className={styles.howItWorks}>
                  <h3>AI 매칭 프로세스</h3>
                  <div className={styles.processSteps}>
                    <div className={styles.processStep}>
                      <div className={styles.stepNumber}>1</div>
                      <div className={styles.stepContent}>
                        <h4>이력서 업로드</h4>
                        <p>이력서 파일을 업로드합니다</p>
                      </div>
                    </div>
                    <div className={styles.processArrow}>→</div>
                    <div className={styles.processStep}>
                      <div className={styles.stepNumber}>2</div>
                      <div className={styles.stepContent}>
                        <h4>AI 분석</h4>
                        <p>기술 스택, 경험, 역량 분석</p>
                      </div>
                    </div>
                    <div className={styles.processArrow}>→</div>
                    <div className={styles.processStep}>
                      <div className={styles.stepNumber}>3</div>
                      <div className={styles.stepContent}>
                        <h4>매칭 결과</h4>
                        <p>최적의 포지션 추천</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 'analyzing' && (
              <div className={styles.analyzingSection}>
                <div className={styles.loader}></div>
                <h2>AI가 이력서를 분석하고 있습니다</h2>
                <p>기술 스택, 경력, 프로젝트 경험을 분석 중...</p>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill}></div>
                </div>
              </div>
            )}

            {step === 'result' && (
              <div className={styles.resultSection}>
                <div className={styles.resultHeader}>
                  <h2>🎉 AI 매칭 결과</h2>
                  <p>회원님의 프로필과 가장 잘 맞는 포지션입니다</p>
                </div>

                <div className={styles.profileSummary}>
                  <h3>분석된 프로필</h3>
                  <div className={styles.skillTags}>
                    <span className={styles.skillTag}>Kotlin</span>
                    <span className={styles.skillTag}>Spring Boot</span>
                    <span className={styles.skillTag}>AWS</span>
                    <span className={styles.skillTag}>Kubernetes</span>
                    <span className={styles.skillTag}>MSA</span>
                  </div>
                  <p className={styles.experienceInfo}>경력 5년+ · 백엔드 개발자 · 금융/핀테크 도메인</p>
                </div>

                <div className={styles.matchList}>
                  {SAMPLE_MATCHES.map((match, idx) => (
                    <div key={match.id} className={styles.matchCard}>
                      <div className={styles.matchRank}>#{idx + 1}</div>
                      <div className={styles.matchContent}>
                        <div className={styles.matchHeader}>
                          <div>
                            <h3 className={styles.matchTitle}>{match.title}</h3>
                            <p className={styles.matchCompany}>{match.company}</p>
                          </div>
                          <div className={styles.matchScore}>
                            <div className={styles.scoreCircle}>
                              <span className={styles.scoreValue}>{match.match}%</span>
                            </div>
                            <span className={styles.scoreLabel}>매칭률</span>
                          </div>
                        </div>
                        <div className={styles.matchReasons}>
                          <span className={styles.reasonLabel}>매칭 이유:</span>
                          {match.reasons.map(reason => (
                            <span key={reason} className={styles.reasonTag}>✓ {reason}</span>
                          ))}
                        </div>
                        <Link href={`/jobs/${match.id}`} className={styles.viewJobBtn}>공고 보기 →</Link>
                      </div>
                    </div>
                  ))}
                </div>

                <button className={styles.retryBtn} onClick={() => setStep('upload')}>다시 분석하기</button>
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
