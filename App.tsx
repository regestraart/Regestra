
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
import { createPageUrl } from './utils';

export default function App() {
  return (
    <HashRouter>
      {/* FIX: Switched to using a layout route, which is a common pattern in react-router-dom v6. This resolves the TypeScript error by nesting page routes within the Layout component route. */}
      <Routes>
        <Route element={<Layout />}>
          <Route path={createPageUrl('Landing')} element={<Landing />} />
          <Route path={createPageUrl('Home')} element={<Home />} />
          <Route path={createPageUrl('HomeSocial')} element={<HomeSocial />} />
          <Route path={createPageUrl('EmailVerification')} element={<EmailVerification />} />
          <Route path={createPageUrl('Upload')} element={<Upload />} />
          <Route path={createPageUrl('Publish')} element={<Publish />} />
          <Route path={createPageUrl('Profile')} element={<Profile />} />
          <Route path={createPageUrl('EditProfile')} element={<EditProfile />} />
          <Route path={createPageUrl('Messages')} element={<Messages />} />
          <Route path={createPageUrl('Login')} element={<Login />} />
          <Route path={createPageUrl('SignUp')} element={<SignUp />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}