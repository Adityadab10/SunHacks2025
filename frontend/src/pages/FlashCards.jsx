import React, { useState } from 'react';
import { Card, Button, Upload, Spin, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const FlashCards = () => {
  const [loading, setLoading] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const handleFileUpload = async (file) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('message', 'Generate flashcards from this document');

    try {
        const response = await fetch('http://127.0.0.1:8000/flashcards', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Failed to generate flashcards');
        }

        if (data.status === 'success' && data.flashcards) {
            setFlashcards(data.flashcards);
            message.success('Flashcards generated successfully!');
        } else {
            throw new Error('No flashcards in response');
        }
    } catch (error) {
        console.error('Upload error:', error);
        message.error(error.message || 'Failed to generate flashcards');
    } finally {
        setLoading(false);
    }
  };

  const handleNext = () => {
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrevious = () => {
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const handleReset = () => {
    setFlashcards([]);
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Flashcards Generator</h1>
      
      <div className="mb-6">
        {!flashcards.length ? (
          <Upload
            beforeUpload={(file) => {
              handleFileUpload(file);
              return false;
            }}
            accept=".pdf"
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>Upload PDF to Generate Flashcards</Button>
          </Upload>
        ) : (
          <Button onClick={handleReset}>Generate New Flashcards</Button>
        )}
      </div>

      {loading && (
        <div className="text-center my-8">
          <Spin size="large" />
          <p className="mt-4">Generating flashcards...</p>
        </div>
      )}

      {flashcards.length > 0 && !loading && (
        <div className="space-y-6">
          <Card className="min-h-[200px]">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">
                Card {currentIndex + 1} of {flashcards.length}
              </h2>
              <div className="mb-4">
                <p className="text-lg">{flashcards[currentIndex].question}</p>
                {showAnswer && (
                  <p className="mt-4 text-green-600">{flashcards[currentIndex].answer}</p>
                )}
              </div>
              <Button onClick={toggleAnswer}>
                {showAnswer ? 'Hide Answer' : 'Show Answer'}
              </Button>
            </div>
          </Card>

          <div className="flex justify-between">
            <Button onClick={handlePrevious}>Previous</Button>
            <Button onClick={handleNext}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashCards;