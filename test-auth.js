// Test script for authentication endpoints
const API_BASE_URL = 'http://localhost:5001/api';

async function testAuth() {
    console.log('Testing Authentication Endpoints...\n');
    
    // Test Registration
    console.log('1. Testing Registration:');
    try {
        const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123'
            })
        });
        
        const registerData = await registerResponse.json();
        console.log('Registration response:', registerData);
        console.log('Status:', registerResponse.status, '\n');
    } catch (error) {
        console.error('Registration error:', error, '\n');
    }
    
    // Test Login
    console.log('2. Testing Login:');
    try {
        const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123'
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('Login response:', loginData);
        console.log('Status:', loginResponse.status);
        
        if (loginData.token) {
            console.log('JWT Token received:', loginData.token.substring(0, 20) + '...');
        }
    } catch (error) {
        console.error('Login error:', error);
    }
}

// Run the test
testAuth();
