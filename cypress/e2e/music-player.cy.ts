describe('Music Player', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: {
        user: {
          id: 'test-user',
          name: 'Test User',
          email: 'test@example.com',
          hasCompletedOnboarding: true
        }
      }
    })

    // Mock music data
    cy.intercept('GET', '/api/music/trending*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: '1',
            name: 'Test Song 1',
            primaryArtists: 'Test Artist 1',
            image: [{ quality: '500x500', url: 'https://example.com/image1.jpg' }],
            duration: 180
          },
          {
            id: '2',
            name: 'Test Song 2',
            primaryArtists: 'Test Artist 2',
            image: [{ quality: '500x500', url: 'https://example.com/image2.jpg' }],
            duration: 210
          }
        ]
      }
    })

    cy.visit('/')
  })

  it('should display trending songs', () => {
    cy.contains('Trending Now')
    cy.contains('Test Song 1')
    cy.contains('Test Artist 1')
    cy.contains('Test Song 2')
    cy.contains('Test Artist 2')
  })

  it('should play a song when clicked', () => {
    // Mock song details API
    cy.intercept('GET', '/api/songs/1', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: '1',
          name: 'Test Song 1',
          primaryArtists: 'Test Artist 1',
          downloadUrl: [{ quality: '320kbps', url: 'https://example.com/song1.mp3' }]
        }
      }
    })

    // Click on first song
    cy.get('[data-testid="music-card"]').first().find('button[aria-label*="play"]').click()

    // Check if player bar appears
    cy.get('[data-testid="player-bar"]').should('be.visible')
    cy.contains('Test Song 1')
    cy.contains('Test Artist 1')
  })

  it('should control playback', () => {
    // Mock song and start playing
    cy.intercept('GET', '/api/songs/1', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: '1',
          name: 'Test Song 1',
          primaryArtists: 'Test Artist 1',
          downloadUrl: [{ quality: '320kbps', url: 'https://example.com/song1.mp3' }]
        }
      }
    })

    cy.get('[data-testid="music-card"]').first().find('button[aria-label*="play"]').click()

    // Test pause/play
    cy.get('[data-testid="play-pause-btn"]').click()
    cy.get('[data-testid="play-pause-btn"]').should('contain', 'play_arrow')

    cy.get('[data-testid="play-pause-btn"]').click()
    cy.get('[data-testid="play-pause-btn"]').should('contain', 'pause')
  })

  it('should adjust volume', () => {
    // Start playing a song first
    cy.intercept('GET', '/api/songs/1', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: '1',
          name: 'Test Song 1',
          primaryArtists: 'Test Artist 1',
          downloadUrl: [{ quality: '320kbps', url: 'https://example.com/song1.mp3' }]
        }
      }
    })

    cy.get('[data-testid="music-card"]').first().find('button[aria-label*="play"]').click()

    // Test volume control
    cy.get('[data-testid="volume-slider"]').should('be.visible')
    cy.get('[data-testid="volume-slider"]').invoke('val', 30).trigger('input')
    
    // Test mute
    cy.get('[data-testid="volume-btn"]').click()
    cy.get('[data-testid="volume-btn"]').should('contain', 'volume_off')
  })

  it('should navigate between songs', () => {
    // Mock multiple songs
    cy.intercept('GET', '/api/songs/1', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: '1',
          name: 'Test Song 1',
          primaryArtists: 'Test Artist 1',
          downloadUrl: [{ quality: '320kbps', url: 'https://example.com/song1.mp3' }]
        }
      }
    })

    cy.intercept('GET', '/api/songs/2', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: '2',
          name: 'Test Song 2',
          primaryArtists: 'Test Artist 2',
          downloadUrl: [{ quality: '320kbps', url: 'https://example.com/song2.mp3' }]
        }
      }
    })

    // Start playing first song
    cy.get('[data-testid="music-card"]').first().find('button[aria-label*="play"]').click()

    // Test next button
    cy.get('[data-testid="next-btn"]').click()
    cy.contains('Test Song 2')

    // Test previous button
    cy.get('[data-testid="prev-btn"]').click()
    cy.contains('Test Song 1')
  })

  it('should expand to full player overlay', () => {
    // Start playing a song
    cy.intercept('GET', '/api/songs/1', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: '1',
          name: 'Test Song 1',
          primaryArtists: 'Test Artist 1',
          downloadUrl: [{ quality: '320kbps', url: 'https://example.com/song1.mp3' }]
        }
      }
    })

    cy.get('[data-testid="music-card"]').first().find('button[aria-label*="play"]').click()

    // Click on player bar to expand
    cy.get('[data-testid="player-bar"]').click()
    cy.get('[data-testid="player-overlay"]').should('be.visible')

    // Close overlay
    cy.get('[data-testid="close-overlay-btn"]').click()
    cy.get('[data-testid="player-overlay"]').should('not.be.visible')
  })
})