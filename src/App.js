import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import './index.css';
import Context from './Context';
import { FirebaseProvider } from './components/UserRoleContext';
import { realTimeDb } from './firebase';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './components/Home';
import Login from './components/Login';
import Loading from './components/Loading';
import PrivateRoute from './components/PrivateRoute';
import PrivateActivate from './components/PrivateActivate';
import PrivateBalance from './components/PrivateBalance';
import PrivateTx from './components/PrivateTx';
import SignUp from './components/SignUp';
import Navbar from './components/Navbar';
import { useLocation } from 'react-router-dom';
import WalletBalance from './components/WalletBalance';
import PaymentModal from './components/PaymentModal';
import TransactionList from './components/Transactions';
import Leaderboard from './components/LeaderBoard';
import PrivateDashboard from './components/PrivateDashboard';
import Dashboard from './components/dashboard';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [cometChat, setCometChat] = useState(null);
  const [selectedFrom, setSelectedFrom] = useState(null);
  const [selectedTo, setSelectedTo] = useState(null);
  const [rideRequest, setRideRequest] = useState(null);
  const [currentRide, setCurrentRide] = useState(null);
  const [ridePrice, setRidePrice] = useState(null);


  const initAuthUser = () => {
    const authenticatedUser = localStorage.getItem('auth');
    if (authenticatedUser) {
      setUser(JSON.parse(authenticatedUser));
    }
  };

  return (
    <Context.Provider value={{ isLoading, setIsLoading, user, setUser, cometChat, selectedFrom, setSelectedFrom, selectedTo, setSelectedTo, rideRequest, setRideRequest, currentRide, setCurrentRide, ridePrice, setRidePrice }}>
      <FirebaseProvider>
        <Router>
          <ErrorBoundary>
            <Navbar />
            <Routes>
              <Route exact path="/" element={<PrivateRoute exact path="/" element={<Home />} />} />
              <Route
                exact
                path="/login"
                element={<Login />}
              />
              <Route
                exact
                path="/signup"
                element={<SignUp />}
              />
              <Route exact path="/balance" element={<PrivateBalance exact path="/balance" element={<WalletBalance/>} />} />
    
              <Route exact path="/transactions" element={<PrivateTx exact path="/transactions" element={<TransactionList/>} />} />
   
              <Route exact path="/activate_account" element={<PrivateActivate exact path="/activate_account" element={<PaymentModal/>} />} />

              
              <Route exact path="/account_Info" element={<PrivateDashboard exact path="/account_Info" element={<Dashboard/>} />} />

              <Route exact path="/leaderboard" element={<Leaderboard/>} />
     
            </Routes>
          </ErrorBoundary>
          {isLoading && <Loading />}
        </Router>
      </FirebaseProvider>
    </Context.Provider>
  );
}

export default App;
