import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Question, UserAnswer } from '../types/quiz';
import Confetti from 'react-confetti';
import { toast } from 'react-hot-toast';
import { Timer, CheckCircle, XCircle, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Quiz() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'questions'));
        const fetchedQuestions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Question[];
        setQuestions(fetchedQuestions);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des questions:', error);
        toast.error('Erreur lors du chargement des questions');
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (quizStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else if (timeLeft === 0 && quizStarted) {
      handleNextQuestion();
    }
  }, [timeLeft, quizStarted]);

  const startQuiz = () => {
    if (questions.length === 0) {
      toast.error('Aucune question disponible');
      return;
    }
    setQuizStarted(true);
    setTimeLeft(questions[0]?.timeLimit || 30);
  };

  const handleAnswer = async (option: { text: string; isCorrect: boolean }, points: number) => {
    const currentQuestionData = questions[currentQuestion];
    const answer: UserAnswer = {
      questionId: currentQuestionData.id,
      questionText: currentQuestionData.text,
      selectedOption: option.text,
      isCorrect: option.isCorrect,
      points: option.isCorrect ? points : 0,
      answeredAt: new Date()
    };

    setUserAnswers([...userAnswers, answer]);

    if (option.isCorrect) {
      setScore(score + points);
      setShowConfetti(true);
      toast.success('Bonne réponse !');
      setTimeout(() => setShowConfetti(false), 3000);
    } else {
      toast.error('Mauvaise réponse');
    }
    handleNextQuestion();
  };

  const handleNextQuestion = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(curr => curr + 1);
      setTimeLeft(questions[currentQuestion + 1].timeLimit);
    } else {
      setQuizStarted(false);
      toast.success(`Quiz terminé ! Score final : ${score} points`);
      
      if (currentUser) {
        try {
          await addDoc(collection(db, 'scores'), {
            userId: currentUser.id,
            score: score,
            totalQuestions: questions.length,
            completedAt: new Date(),
            answers: userAnswers
          });
        } catch (error) {
          console.error('Erreur lors de la sauvegarde du score:', error);
        }
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
      toast.success('Déconnexion réussie');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-white">
        <div className="text-xl font-semibold text-gray-700">Chargement des questions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-white p-4">
      {showConfetti && <Confetti />}
      
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            {currentUser && (
              <span className="text-sm text-gray-600">
                Connecté en tant que {currentUser.firstName}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:text-red-700"
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>

        {!quizStarted ? (
          <div className="bg-white rounded-xl shadow-lg p-8 space-y-4">
            {currentQuestion === 0 ? (
              <>
                <h2 className="text-2xl font-bold text-center text-gray-900">Prêt à commencer le quiz ?</h2>
                {questions.length > 0 ? (
                  <>
                    <p className="text-center text-gray-600 mb-4">
                      {currentUser ? (
                        'Vos scores seront enregistrés'
                      ) : (
                        'Connectez-vous pour enregistrer vos scores'
                      )}
                    </p>
                    <button
                      onClick={startQuiz}
                      className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Commencer
                    </button>
                  </>
                ) : (
                  <p className="text-center text-gray-600">Aucune question disponible pour le moment.</p>
                )}
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-center text-gray-900">Quiz terminé !</h2>
                <p className="text-center text-lg">Score final : {score} points</p>
                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-semibold">Vos réponses :</h3>
                  {userAnswers.map((answer, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium">{answer.questionText}</p>
                      <div className="flex items-center mt-2">
                        <span className={`flex items-center ${answer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                          {answer.isCorrect ? (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-2" />
                          )}
                          {answer.selectedOption}
                        </span>
                        <span className="ml-auto">
                          {answer.points} points
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Recommencer
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-semibold">Score: {score}</span>
              <div className="flex items-center space-x-2">
                <Timer className="w-5 h-5 text-indigo-600" />
                <span className="text-lg font-semibold">{timeLeft}s</span>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4">Question {currentQuestion + 1}/{questions.length}</h3>
              <p className="text-lg">{questions[currentQuestion]?.text}</p>
            </div>

            <div className="grid gap-4">
              {questions[currentQuestion]?.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option, questions[currentQuestion].points)}
                  className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                >
                  {option.text}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}