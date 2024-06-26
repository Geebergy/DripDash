import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useMatch, useResolvedPath, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
// import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
// import Tooltip from 'react-bootstrap/Tooltip';

import 'bootstrap/dist/css/bootstrap.min.css';
import Context from '../Context';
import { useFirebase } from './UserRoleContext';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Navbar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const { user, setUser } = useContext(Context);
  const {userImg, userEmail, userFullName, userID, userPhoneNo ,userRole, userBalance, setUserBalance, accountLimit, setAccountLimit, referralsBalance, setReferralsBalance, dailyDropBalance, setDailyDropBalance, isUserActive, setIsUserActive, referralsCount, setReferralsCount, totalReferrals, setTotalReferrals, referralCode, setReferralCode, hasPaid, referredUsers, setReferredUsers, adRevenue, setAdRevenue, deposit, setDeposit, isTaskConfirmed, setIsTaskConfirmed, isTaskPending, setIsTaskPending, completedTasks, setCompletedTasks, isTaskPendingTwo, setIsTaskPendingTwo, isTaskConfirmedTwo, setIsTaskConfirmedTwo,  isTaskPendingThree, setIsTaskPendingThree, isTaskConfirmedThree, setIsTaskConfirmedThree, isTaskPendingFour, setIsTaskPendingFour, isTaskConfirmedFour, setIsTaskConfirmedFour, isTaskPendingFive, setIsTaskPendingFive, isTaskConfirmedFive, setIsTaskConfirmedFive,  isTaskDeclined, setIsTaskDeclined, isTaskDeclinedTwo, setIsTaskDeclinedTwo, isTaskDeclinedThree, setIsTaskDeclinedThree, isTaskDeclinedFour, setIsTaskDeclinedFour, isTaskDeclinedFive, setIsTaskDeclinedFive, isTaskActuallyConfirmed, setIsTaskActuallyConfirmed, isTaskActuallyConfirmedTwo, setIsTaskActuallyConfirmedTwo, isTaskActuallyConfirmedThree, setIsTaskActuallyConfirmedThree, isTaskActuallyConfirmedFour, setIsTaskActuallyConfirmedFour, isTaskActuallyConfirmedFive, setIsTaskActuallyConfirmedFive,  activeTaskOne, setActiveTaskOne, activeTaskTwo, setActiveTaskTwo, activeTaskThree, setActiveTaskThree, activeTaskFour, setActiveTaskFour, activeTaskFive, setActiveTaskFive } = useFirebase();
  const history = useNavigate();


  


  const toggleModal = () => {
    setIsModalOpen((prevState) => !prevState);
    toggleNav();
  };
  const toggleNav = () => {
    setShowNav(!showNav);
  };

  const logout = () => {
    const isLogout = window.confirm('Do you want to log out ?');
    if (isLogout) {
      const auth = getAuth();
      signOut(auth)
      .then(() => {
        console.log('User signed out');
        // You can also redirect the user or perform other actions upon sign-out.
      })
      .catch((error) => {
        console.error('Error signing out:', error);
      });
      // remove local storage.
      localStorage.removeItem('auth');
      // remove authenticated user from context.
      setUser(null);
      setIsModalOpen(false);
      toggleNav();
      // redirect to login page.
      history('/login');
    }
  }
const initializeTooltip = (element) => {
  if (element) {
    const tooltip = new window.bootstrap.Tooltip(element, {
      placement: 'top', // Adjust placement as needed
      title: element.title,
    });
  }
};

  const tooltipRef = useRef();

  useEffect(() => {
    initializeTooltip(tooltipRef.current);
  }, []);

  const CustomLink = ({ to, children, ...props }) => {
    const resolvedPath = useResolvedPath(to);
    const isActive = useMatch({ path: resolvedPath.pathname, end: true });

    return (
      <li className={isActive ? 'active' : ''}>
        <Link to={to} {...props}>
          {children}
        </Link>
      </li>
    );
  };

  const handleCopy = () => {
    // Create a temporary input element to facilitate copying
    const tempInput = document.createElement('input');
    
    // Set the value of the input to the referral ID
    tempInput.value = `https://dripdash.netlify.app/login?ref=${referralCode}`;
    
    // Append the input element to the DOM (not visible)
    document.body.appendChild(tempInput);
    
    // Select the text in the input
    tempInput.select();
    
    // Execute the copy command
    document.execCommand('copy');
    
    // Remove the temporary input element from the DOM
    document.body.removeChild(tempInput);

    // Optionally, provide feedback to the user (e.g., a tooltip or notification)
    toast.info('Referral link copied to clipboard!', {
      position: toast.POSITION.TOP_CENTER,
    });
  };


  return (
    <>
    <ToastContainer />
        {showNav && (
        <div className="backdrop"></div>
      )}
        {isModalOpen && (
          <div className={`bottom-right-modal`}>
            <div className='close d-flex justify-content-between align-items-center' onClick={toggleModal}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" alt="close"
               height="20" fill="currentColor" className="bi bi-x-lg" viewBox="0 0 16 16">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
            </svg>
            <span className='bold'>Close</span>
            </div>
            <div className="modal-content">
              {/* Add your modal content here */}
             
              <div className="ride-detail__user-avatar">
                <img src={userImg} />
              </div>
              <div className='text-center bold'>
                <p className="u-e">{userEmail}</p>
                <p>{userPhoneNo}</p>
                <div className='d-flex align-items-start justify-content-between b-top'>
                  <p className='mt-3'>Your Referral Link:</p>
                  <button className='remove-btn-style' onClick={handleCopy}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-copy" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2Zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6ZM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2Z"/>
                  </svg></button>
                </div>
              </div>
              <p>Account Limit: <span className='bold'>{accountLimit}</span></p>

              <Link className="d-flex align-items-center justify-content-between bold text-dark bold ctThree" to="/account_Info">
                <span>More Info</span>
                <span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-right" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/>
                </svg>
                </span>
              </Link>
              
              <span className="header__logout text-center text-danger bold align-items-center justify-content-center" onClick={logout}>Logout</span>
            </div>
            
            </div>
        )}
      
      <nav className={`navbar ${userRole === 'checker' ? 'site-nav-checker' : 'site-nav'} navbar-dark bg-light`}>
        <div className="container">
          <ul className="nav justify-content-between align-items-start w-100">
     
            <CustomLink className="nav-link text-secondary" data-bs-toggle="tooltip" data-bs-placement="top" title="Home" to="/">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="currentColor"
                className="bi bi-house"
                viewBox="0 0 16 16"
              >
                <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.707 1.5ZM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5 5 5Z" />
              </svg>
            </CustomLink>


            <CustomLink className="nav-link text-secondary" data-bs-toggle="tooltip" data-bs-placement="top" title="Wallet Balance" to="/balance">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="currentColor"
                className="bi bi-wallet2"
                viewBox="0 0 16 16"
              >
                <path d="M12.136.326A1.5 1.5 0 0 1 14 1.78V3h.5A1.5 1.5 0 0 1 16 4.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 13.5v-9a1.5 1.5 0 0 1 1.432-1.499L12.136.326zM5.562 3H13V1.78a.5.5 0 0 0-.621-.484L5.562 3zM1.5 4a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-13z" />
              </svg>
            </CustomLink>

            <CustomLink className="nav-link text-secondary"  data-bs-toggle="tooltip" data-bs-placement="top" title="Transactions" to="/transactions">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="currentColor"
                className="bi bi-cash-stack"
                viewBox="0 0 16 16"
              >
                <path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1H1zm7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                <path d="M0 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V5zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V7a2 2 0 0 1-2-2H3z" />
              </svg>
            </CustomLink>

            <button
              className="nav-link text-secondary"
              to="/notifications"
              onClick={toggleModal} ref={tooltipRef}
              data-bs-toggle="tooltip" data-bs-placement="top" title="More"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="currentColor"
                className="bi bi-three-dots"
                viewBox="0 0 16 16"
              >
                <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
              </svg>
            </button>
          </ul>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
