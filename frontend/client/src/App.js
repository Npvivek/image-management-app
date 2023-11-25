// frontend/src/App.js

import React, { useState, useEffect } from 'react';

function App() {
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loggedIn, setLoggedIn] = useState(false);
  const [userData, setUserData] = useState({ username: '', role: '' });
  const [images, setImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(5);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [newLabel, setNewLabel] = useState('');

  const fetchImages = async () => {
    try {
      setLoading(true);

      // Fetch user data to check if the user is authenticated
      const userResponse = await fetch('http://localhost:5001/user', {
        credentials: 'include',
      });

      if (!userResponse.ok) {
        console.error('User not authenticated');
        alert('User not authenticated. Please log in.');
        return;
      }

      // Fetch images based on the current page and per page count
      const response = await fetch(`http://localhost:5001/images?page=${currentPage}&per_page=${perPage}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setImages(data);
      } else {
        console.error('Error fetching images:', data);
        alert('Error fetching images. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      alert('An error occurred while fetching images.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch images when the component mounts
    fetchImages();
  }, [currentPage, perPage]); // Fetch images when the page or perPage changes

  const handleLogin = async () => {
    try {
      setLoading(true);

      // Send a POST request to the login endpoint
      const response = await fetch('http://localhost:5001/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        // If login is successful, update the state
        setLoggedIn(true);
        setUserData({ username: loginData.username, role: data.role });
        // Fetch images after login
        fetchImages();
      } else {
        alert('Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      alert('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      // Fetch user data to check if the user is authenticated
      const response = await fetch('http://localhost:5001/user', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setLoggedIn(true);
        setUserData({ username: data.username, role: data.role });
        // Fetch images after getting user data
        fetchImages();
      } else {
        setLoggedIn(false);
        setUserData({ username: '', role: '' });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      alert('An error occurred while fetching user data.');
    }
  };

  const handleLogout = async () => {
    try {
      // Send a request to the logout endpoint
      const response = await fetch('http://localhost:5001/logout', {
        credentials: 'include',
      });

      if (response.ok) {
        // If logout is successful, update the state
        setLoggedIn(false);
        setUserData({ username: '', role: '' });
      } else {
        alert('Logout failed. Please try again.');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      alert('An error occurred during logout. Please try again.');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);

      // Send a POST request to the upload endpoint
      const response = await fetch('http://localhost:5001/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        alert(`File uploaded successfully: ${data.filename}`);
        // Fetch images after successful file upload
        fetchImages();
      } else {
        alert(`File upload failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Error during file upload:', error);
      alert('An error occurred during file upload. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLabelUpdate = async (imageFilename, label) => {
    try {
      // Send a POST request to the label endpoint
      const response = await fetch('http://localhost:5001/label', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_filename: imageFilename, label }),
        credentials: 'include',
      });

      if (response.ok) {
        alert('Label updated successfully');
        // Fetch images after updating the label
        fetchImages();
      } else {
        alert('Failed to update label. Please try again.');
      }
    } catch (error) {
      console.error('Error updating label:', error);
      alert('An error occurred while updating the label. Please try again.');
    }
  };

  const handleAdminDashboard = async () => {
    try {
      // Send a request to the admin-dashboard endpoint
      const response = await fetch('http://localhost:5001/admin-dashboard', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
      } else {
        alert('Unauthorized access to Admin Dashboard. Please log in as an admin.');
      }
    } catch (error) {
      console.error('Error accessing Admin Dashboard:', error);
      alert('An error occurred while accessing Admin Dashboard.');
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleCreateLabel = async () => {
    try {
      if (!selectedImage) {
        alert('Please select an image before creating a label.');
        return;
      }

      // Send a POST request to the label endpoint for creating a label
      const response = await fetch('http://localhost:5001/label', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image_filename: selectedImage.filename, label: newLabel }),
        credentials: 'include',
      });

      if (response.ok) {
        alert('Label created successfully');
        // Fetch images after creating a label
        fetchImages();
      } else {
        alert('Failed to create label. Please try again.');
      }
    } catch (error) {
      console.error('Error creating label:', error);
      alert('An error occurred while creating the label. Please try again.');
    }
  };

  return (
    <div>
      {loggedIn ? (
        <div>
          <h1>Welcome, {userData.username}!</h1>
          <p>Role: {userData.role}</p>
          <button onClick={handleLogout}>Logout</button>

          {userData.role === 'admin' && (
            <div>
              <button onClick={handleAdminDashboard}>Admin Dashboard</button>
              <input type="file" accept="image/*" onChange={handleFileUpload} />
              <div>
                <label>
                  Create Label:
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                  />
                  <button onClick={handleCreateLabel}>Create Label</button>
                </label>
              </div>
            </div>
          )}

          <div>
            <h2>Images</h2>
            {images.map((image) => (
              <div key={image.filename}>
                <img
                  src={`http://localhost:5001/uploads/${image.filename}`}
                  alt={image.filename}
                  style={{ width: '100px', marginRight: '10px' }}
                  onClick={() => setSelectedImage(image)}
                />
                {userData.role === 'admin' && (
                  <div>
                    <input
                      type="text"
                      placeholder="Assign Label"
                      value={image.label || ''}
                      onChange={(e) => handleLabelUpdate(image.filename, e.target.value)}
                    />
                  </div>
                )}
              </div>
            ))}
            <div>
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                Previous Page
              </button>
              <span> Page {currentPage} </span>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={images.length < perPage}>
                Next Page
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <label>
            Username:
            <input
              type="text"
              name="username"
              value={loginData.username}
              onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
            />
          </label>
          <label>
            Password:
            <input
              type="password"
              name="password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            />
          </label>
          <button onClick={handleLogin}>Login</button>
        </div>
      )}
    </div>
  );
}

export default App;
