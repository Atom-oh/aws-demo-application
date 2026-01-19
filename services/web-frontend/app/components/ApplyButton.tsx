'use client';

import { useState } from 'react';
import ApplyModal from './ApplyModal';

interface ApplyButtonProps {
  jobTitle: string;
  company: string;
  className?: string;
}

export default function ApplyButton({ jobTitle, company, className }: ApplyButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button className={className} onClick={() => setIsModalOpen(true)}>
        지원하기
      </button>
      <ApplyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        jobTitle={jobTitle}
        company={company}
      />
    </>
  );
}
