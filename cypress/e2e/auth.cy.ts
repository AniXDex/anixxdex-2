describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('should display login page', () => {
    cy.contains('Welcome Back')
    cy.get('input[type="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.get('button[type="submit"]').should('contain', 'Sign In')
  })

  it('should show validation errors for empty form', () => {
    cy.get('button[type="submit"]').click()
    cy.contains('Email is required')
    cy.contains('Password is required')
  })

  it('should show error for invalid email format', () => {
    cy.get('input[type="email"]').type('invalid-email')
    cy.get('input[type="password"]').type('password123')
    cy.get('button[type="submit"]').click()
    cy.contains('Please enter a valid email address')
  })

  it('should navigate to register page', () => {
    cy.contains('Create an account').click()
    cy.url().should('include', '/register')
    cy.contains('Create Account')
  })

  it('should handle successful login', () => {
    // Mock successful login
    cy.intercept('POST', '/api/auth/callback/credentials', {
      statusCode: 200,
      body: { url: '/' }
    }).as('login')

    cy.get('input[type="email"]').type('test@example.com')
    cy.get('input[type="password"]').type('password123')
    cy.get('button[type="submit"]').click()

    cy.wait('@login')
    cy.url().should('eq', Cypress.config().baseUrl + '/')
  })

  it('should handle login error', () => {
    cy.intercept('POST', '/api/auth/callback/credentials', {
      statusCode: 401,
      body: { error: 'Invalid credentials' }
    }).as('loginError')

    cy.get('input[type="email"]').type('test@example.com')
    cy.get('input[type="password"]').type('wrongpassword')
    cy.get('button[type="submit"]').click()

    cy.wait('@loginError')
    cy.contains('Invalid credentials')
  })

  it('should show Google login option', () => {
    cy.get('button').contains('Continue with Google').should('be.visible')
  })
})

describe('Registration Flow', () => {
  beforeEach(() => {
    cy.visit('/register')
  })

  it('should display registration form', () => {
    cy.contains('Create Account')
    cy.get('input[name="name"]').should('be.visible')
    cy.get('input[name="email"]').should('be.visible')
    cy.get('input[name="password"]').should('be.visible')
    cy.get('input[name="confirmPassword"]').should('be.visible')
  })

  it('should validate password confirmation', () => {
    cy.get('input[name="name"]').type('Test User')
    cy.get('input[name="email"]').type('test@example.com')
    cy.get('input[name="password"]').type('password123')
    cy.get('input[name="confirmPassword"]').type('differentpassword')
    cy.get('button[type="submit"]').click()
    
    cy.contains('Passwords do not match')
  })

  it('should handle successful registration', () => {
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 200,
      body: { success: true, message: 'Account created successfully' }
    }).as('register')

    cy.get('input[name="name"]').type('Test User')
    cy.get('input[name="email"]').type('test@example.com')
    cy.get('input[name="password"]').type('password123')
    cy.get('input[name="confirmPassword"]').type('password123')
    cy.get('button[type="submit"]').click()

    cy.wait('@register')
    cy.contains('Account created successfully')
  })
})