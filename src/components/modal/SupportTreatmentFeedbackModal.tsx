'use client';

import { useState, useEffect } from 'react';

interface SupportTreatmentFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportTreatmentFeedbackModal({
  isOpen,
  onClose,
}: SupportTreatmentFeedbackModalProps) {
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = () => {
    console.log('Feedback submitted:', feedback);
    setFeedback('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Feedback</h2>
        
        <p className="text-gray-600 mb-4">
        제공한 리스트외에 추가 하고 싶으신 항목 혹은 잘못된 수정되어야할 항목을 피드백주시면 반영하겠습니다.  감사합니다.
        </p>

        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="w-full h-40 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Enter your feedback here..."
        />

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!feedback.trim()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
