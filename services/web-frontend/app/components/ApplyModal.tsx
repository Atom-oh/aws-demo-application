'use client';

import { useState, useCallback } from 'react';
import styles from './ApplyModal.module.css';

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  company: string;
}

type Step = 'upload' | 'processing' | 'preview' | 'complete';

// 샘플 PII 마스킹 결과
const SAMPLE_ORIGINAL = `이력서

이름: 김철수
연락처: 010-1234-5678
이메일: chulsoo.kim@gmail.com
주소: 서울시 강남구 테헤란로 123번길 45, 현대아파트 101동 1502호
주민등록번호: 901225-1234567

학력
- 서울대학교 컴퓨터공학과 졸업 (2015)
- GPA: 3.8/4.5

경력
토스 (2020.03 ~ 현재)
- Backend Engineer
- Kotlin/Spring 기반 결제 시스템 개발
- 일 1000만 건 이상 트랜잭션 처리

카카오 (2017.01 ~ 2020.02)
- Software Engineer
- Java 기반 메시징 시스템 개발`;

const SAMPLE_MASKED = `이력서

이름: [이름]
연락처: [전화번호]
이메일: [이메일]
주소: [주소]
주민등록번호: [주민등록번호]

학력
- 서울대학교 컴퓨터공학과 졸업 (2015)
- GPA: 3.8/4.5

경력
토스 (2020.03 ~ 현재)
- Backend Engineer
- Kotlin/Spring 기반 결제 시스템 개발
- 일 1000만 건 이상 트랜잭션 처리

카카오 (2017.01 ~ 2020.02)
- Software Engineer
- Java 기반 메시징 시스템 개발`;

const PII_ITEMS = [
  { type: '이름', original: '김철수', masked: '[이름]' },
  { type: '전화번호', original: '010-1234-5678', masked: '[전화번호]' },
  { type: '이메일', original: 'chulsoo.kim@gmail.com', masked: '[이메일]' },
  { type: '주소', original: '서울시 강남구 테헤란로...', masked: '[주소]' },
  { type: '주민등록번호', original: '901225-1234567', masked: '[주민등록번호]' },
];

export default function ApplyModal({ isOpen, onClose, jobTitle, company }: ApplyModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = useCallback((file: File) => {
    setFileName(file.name);
    setStep('processing');
    // 시뮬레이션: 2초 후 미리보기로 전환
    setTimeout(() => setStep('preview'), 2000);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleSubmit = () => {
    setStep('complete');
  };

  const handleClose = () => {
    setStep('upload');
    setFileName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={handleClose}>×</button>

        {step === 'upload' && (
          <div className={styles.stepContent}>
            <div className={styles.header}>
              <h2>지원하기</h2>
              <p className={styles.jobInfo}>{company} · {jobTitle}</p>
            </div>

            <div className={styles.notice}>
              <span className={styles.noticeIcon}>🔒</span>
              <div>
                <strong>개인정보 보호</strong>
                <p>업로드된 이력서는 AI가 자동으로 민감정보를 마스킹합니다</p>
              </div>
            </div>

            <div
              className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ''}`}
              onDragOver={e => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <div className={styles.dropzoneIcon}>📄</div>
              <h3>이력서를 업로드하세요</h3>
              <p>PDF, DOCX, HWP 파일 지원 (최대 10MB)</p>
              <label className={styles.uploadBtn}>
                파일 선택
                <input
                  type="file"
                  accept=".pdf,.docx,.hwp"
                  onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  hidden
                />
              </label>
              <p className={styles.hint}>또는 파일을 여기에 드래그</p>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className={styles.stepContent}>
            <div className={styles.processing}>
              <div className={styles.spinner}></div>
              <h2>이력서 분석 중...</h2>
              <p>AI가 개인정보를 탐지하고 마스킹하고 있습니다</p>
              <div className={styles.fileName}>📄 {fileName}</div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill}></div>
              </div>
              <div className={styles.processingSteps}>
                <div className={styles.processingStep}>✓ 파일 업로드 완료</div>
                <div className={styles.processingStep}>✓ 텍스트 추출 중...</div>
                <div className={`${styles.processingStep} ${styles.active}`}>⟳ PII 탐지 및 마스킹...</div>
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className={styles.stepContent}>
            <div className={styles.header}>
              <h2>PII 마스킹 결과</h2>
              <p>개인정보가 아래와 같이 마스킹되었습니다</p>
            </div>

            <div className={styles.piiSummary}>
              <h4>탐지된 개인정보 ({PII_ITEMS.length}건)</h4>
              <div className={styles.piiList}>
                {PII_ITEMS.map((item, i) => (
                  <div key={i} className={styles.piiItem}>
                    <span className={styles.piiType}>{item.type}</span>
                    <span className={styles.piiOriginal}>{item.original}</span>
                    <span className={styles.piiArrow}>→</span>
                    <span className={styles.piiMasked}>{item.masked}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.previewContainer}>
              <div className={styles.previewColumn}>
                <h4>원본</h4>
                <pre className={styles.previewText}>{SAMPLE_ORIGINAL}</pre>
              </div>
              <div className={styles.previewColumn}>
                <h4>마스킹 후 (제출될 내용)</h4>
                <pre className={`${styles.previewText} ${styles.masked}`}>{SAMPLE_MASKED}</pre>
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.secondaryBtn} onClick={() => setStep('upload')}>
                다시 업로드
              </button>
              <button className={styles.primaryBtn} onClick={handleSubmit}>
                이대로 지원하기
              </button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className={styles.stepContent}>
            <div className={styles.complete}>
              <div className={styles.completeIcon}>✓</div>
              <h2>지원이 완료되었습니다!</h2>
              <p>{company}의 {jobTitle} 포지션에 지원되었습니다</p>

              <div className={styles.completeInfo}>
                <div className={styles.infoRow}>
                  <span>지원 번호</span>
                  <strong>APP-2026-{String(Math.floor(Math.random() * 10000)).padStart(4, '0')}</strong>
                </div>
                <div className={styles.infoRow}>
                  <span>지원 일시</span>
                  <strong>{new Date().toLocaleString('ko-KR')}</strong>
                </div>
                <div className={styles.infoRow}>
                  <span>PII 마스킹</span>
                  <strong className={styles.success}>5건 처리 완료</strong>
                </div>
              </div>

              <p className={styles.completeNote}>
                서류 검토 후 결과를 이메일로 안내드립니다
              </p>

              <button className={styles.primaryBtn} onClick={handleClose}>
                확인
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
