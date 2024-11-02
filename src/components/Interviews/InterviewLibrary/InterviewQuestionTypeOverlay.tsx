'use client';

import { useState } from 'react';
import { Button } from '../../ui/button';

export const InterviewQuestionTypeOverlay = ({ onSelect }) => {
  const [selectedTypes, setSelectedTypes] = useState([]);

  const handleSelect = (type) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  const handleContinue = () => {
    onSelect(selectedTypes);
  };

  return (
    <div className="overlay">
      <h2>Select Question Types</h2>
      <div>
        <label>
          <input type="checkbox" onChange={() => handleSelect('General')} />
          General
        </label>
        <label>
          <input type="checkbox" onChange={() => handleSelect('Behavioral')} />
          Behavioral
        </label>
        <label>
          <input type="checkbox" onChange={() => handleSelect('Situational')} />
          Situational
        </label>
        <label>
          <input
            type="checkbox"
            onChange={() => handleSelect('Role-Specific')}
          />
          Role-Specific
        </label>
        <label>
          <input type="checkbox" onChange={() => handleSelect('Operational')} />
          Operational
        </label>
      </div>
      <Button onClick={handleContinue}>Continue</Button>
    </div>
  );
};
