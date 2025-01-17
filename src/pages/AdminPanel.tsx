import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { PlusCircle, Trash2, CheckCircle, XCircle, Users, BookOpen, Trophy, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface UserScore {
  id: string;
  userId: string;
  userName: string;
  score: number;
  totalQuestions: number;
  completedAt: any;
}

interface UserScoreHistory {
  userName: string;
  userId: string;
  scores: UserScore[];
  totalScore: number;
  quizCount: number;
  averageScore: number;
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'users' | 'questions' | 'scores'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [scores, setScores] = useState<UserScoreHistory[]>([]);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    options: [{ text: '', isCorrect: false }],
    timeLimit: 30,
    points: 1
  });

  const [newUser, setNewUser] = useState({
    nom: '',
    email: '',
    password: '',
    admin: false
  });

  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    fetchQuestions();
    fetchScores();
  }, []);

  const fetchUsers = async () => {
    const querySnapshot = await getDocs(collection(db, 'auth'));
    const usersData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setUsers(usersData);
  };

  const fetchQuestions = async () => {
    const querySnapshot = await getDocs(collection(db, 'questions'));
    const questionsData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setQuestions(questionsData);
  };

  const fetchScores = async () => {
    const querySnapshot = await getDocs(collection(db, 'scores'));
    const scoresData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      completedAt: doc.data().completedAt?.toDate() || new Date()
    }));
    
    const usersSnapshot = await getDocs(collection(db, 'auth'));
    const usersMap = new Map();
    usersSnapshot.docs.forEach(doc => {
      usersMap.set(doc.id, doc.data().nom);
    });

    const scoresByUser = new Map<string, UserScoreHistory>();
    
    scoresData.forEach((score: UserScore) => {
      const userName = usersMap.get(score.userId) || 'Utilisateur inconnu';
      score.userName = userName;
      
      if (!scoresByUser.has(score.userId)) {
        scoresByUser.set(score.userId, {
          userName,
          userId: score.userId,
          scores: [],
          totalScore: 0,
          quizCount: 0,
          averageScore: 0
        });
      }
      
      const userHistory = scoresByUser.get(score.userId)!;
      userHistory.scores.push(score);
      userHistory.totalScore += score.score;
      userHistory.quizCount += 1;
      userHistory.averageScore = Math.round(userHistory.totalScore / userHistory.quizCount);
      
      userHistory.scores.sort((a, b) => b.completedAt - a.completedAt);
    });

    setScores(Array.from(scoresByUser.values()));
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'questions'), newQuestion);
      toast.success('Question ajoutée');
      setNewQuestion({
        text: '',
        options: [{ text: '', isCorrect: false }],
        timeLimit: 30,
        points: 1
      });
      fetchQuestions();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de la question');
    }
  };

  const handleAddOption = () => {
    setNewQuestion({
      ...newQuestion,
      options: [...newQuestion.options, { text: '', isCorrect: false }]
    });
  };

  const handleOptionChange = (index: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    const updatedOptions = [...newQuestion.options];
    updatedOptions[index] = { ...updatedOptions[index], [field]: value };
    setNewQuestion({ ...newQuestion, options: updatedOptions });
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await deleteDoc(doc(db, 'questions', questionId));
      toast.success('Question supprimée');
      fetchQuestions();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password
      );

      await addDoc(collection(db, 'auth'), {
        userId: userCredential.user.uid,
        nom: newUser.nom,
        email: newUser.email,
        admin: newUser.admin
      });

      toast.success('Utilisateur créé');
      setNewUser({
        nom: '',
        email: '',
        password: '',
        admin: false
      });
      fetchUsers();
    } catch (error) {
      toast.error('Erreur lors de la création de l\'utilisateur');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'auth', userId));
      toast.success('Utilisateur supprimé');
      fetchUsers();
    } catch (error) {
      toast.error('Erreur lors de la suppression de l\'utilisateur');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-white p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Panel Administrateur</h1>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-red-700"
          >
            <LogOut className="w-5 h-5" />
            <span>Déconnexion</span>
          </button>
        </div>

        <div className="flex space-x-4 border-b border-gray-200">
          <button
            className={`flex items-center px-4 py-2 border-b-2 ${
              activeTab === 'users'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('users')}
          >
            <Users className="w-5 h-5 mr-2" />
            Gestion des utilisateurs
          </button>
          <button
            className={`flex items-center px-4 py-2 border-b-2 ${
              activeTab === 'questions'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('questions')}
          >
            <BookOpen className="w-5 h-5 mr-2" />
            Gestion des QCM
          </button>
          <button
            className={`flex items-center px-4 py-2 border-b-2 ${
              activeTab === 'scores'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('scores')}
          >
            <Trophy className="w-5 h-5 mr-2" />
            Scores
          </button>
        </div>

        {activeTab === 'users' && (
          <>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Créer un utilisateur</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom complet</label>
                  <input
                    type="text"
                    value={newUser.nom}
                    onChange={(e) => setNewUser({ ...newUser, nom: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newUser.admin}
                    onChange={(e) => setNewUser({ ...newUser, admin: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Administrateur
                  </label>
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Créer l'utilisateur
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Utilisateurs existants</h2>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{user.nom}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      {user.admin && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          Admin
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'questions' && (
          <>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Ajouter une question</h2>
              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Question</label>
                  <input
                    type="text"
                    value={newQuestion.text}
                    onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="space-y-4">
                  {newQuestion.options.map((option, index) => (
                    <div key={index} className="flex space-x-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          required
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={option.isCorrect}
                          onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-600">Correcte</label>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddOption}
                  className="flex items-center text-indigo-600 hover:text-indigo-700"
                >
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Ajouter une option
                </button>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Temps limite (secondes)</label>
                    <input
                      type="number"
                      value={newQuestion.timeLimit}
                      onChange={(e) => setNewQuestion({ ...newQuestion, timeLimit: parseInt(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Points</label>
                    <input
                      type="number"
                      value={newQuestion.points}
                      onChange={(e) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                      min="1"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Ajouter la question
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Questions existantes</h2>
              <div className="space-y-4">
                {questions.map((question) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{question.text}</p>
                        <div className="mt-2 space-y-1">
                          {question.options.map((option: any, index: number) => (
                            <div key={index} className="flex items-center">
                              {option.isCorrect ? (
                                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500 mr-2" />
                              )}
                              <span>{option.text}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <span>Temps: {question.timeLimit}s</span>
                          <span className="ml-4">Points: {question.points}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'scores' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Historique des scores</h2>
            <div className="space-y-6">
              {scores.map((userHistory) => (
                <div key={userHistory.userId} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{userHistory.userName}</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Score total: {userHistory.totalScore} points</p>
                        <p>Moyenne: {userHistory.averageScore} points par quiz</p>
                        <p>Nombre de quiz complétés: {userHistory.quizCount}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">Détail des quiz</h4>
                    <div className="space-y-2">
                      {userHistory.scores.map((score) => (
                        <div key={score.id} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium">Score: {score.score} points</p>
                              <p className="text-xs text-gray-500">
                                {score.completedAt.toLocaleDateString()} à {score.completedAt.toLocaleTimeString()}
                              </p>
                            </div>
                            <p className="text-sm text-gray-600">
                              {score.totalQuestions} questions
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}