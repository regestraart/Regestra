
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './layout/Layout';
import Landing from './pages/Landing';
import Home from './pages/Home';
import HomeSocial from './pages/HomeSocial';
import EmailVerification from './pages/EmailVerification';
import Upload from './pages/Upload';
import Publish from './pages/Publish';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Messages from './pages/Messages';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import { UserProvider } from './context/UserContext';

export default function App() {
  return (
    <HashRouter>
      <UserProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="home" element={<Home />} />
            <Route path="home-social" element={<HomeSocial />} />
            <Route path="email-verification" element={<EmailVerification />} />
            <Route path="upload" element={<Upload />} />
            <Route path="publish" element={<Publish />} />
            <Route path="profile/:userId" element={<Profile />} />
            <Route path="edit-profile" element={<EditProfile />} />
            <Route path="messages" element={<Messages />} />
            <Route path="login" element={<Login />} />
            <Route path="sign-up" element={<SignUp />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
          </Route>
        </Routes>
      </UserProvider>
    </HashRouter>
  );
}
