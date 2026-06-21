import React from 'react'
import "./Landing.css"
import { ArrowRightFromLineIcon, ArrowRightIcon, CheckCheckIcon, ExternalLinkIcon, MailIcon } from 'lucide-react'
import { FaDiscord, FaGithub } from 'react-icons/fa6'
import { useNavigate } from 'react-router-dom'
import { TbArrowsDiagonal } from 'react-icons/tb'
import { GoArrowUpRight } from 'react-icons/go'

function Landing() {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [hasGotStarted, setHasGotStarted] = React.useState(false)

  React.useEffect(() => {
    const hasGotStartedData = localStorage.getItem('hasGotStarted');
    setHasGotStarted(hasGotStartedData);
  }, [])

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/projects')
    localStorage.setItem('hasGotStarted', true);
  }

  return (
    <div id="home" className='landing'>
      <div className={`landing-navbar ${isScrolled ? 'scrolled' : ''}`}>
        <p className='logo'><span className='logo'>co</span>DIRECT</p>

        {/* Hamburger button visible only on mobile */}
        <button className='menu-toggle' onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>

        {/* Navigation links */}
        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <button className='nav-button' onClick={() => { scrollToSection('home'); setMenuOpen(false) }}>Home</button>
          <button className='nav-button' onClick={() => { scrollToSection('features'); setMenuOpen(false) }}>Features</button>
          <button className='nav-button' onClick={() => { scrollToSection('contact'); setMenuOpen(false) }}>Contact</button>
          <a href='https://docs.codirect.live' target='_blank' className='nav-button'>Docs <GoArrowUpRight /></a>
        </div>
      </div>

      <div className='section'>
        <h1>
          The Ultimate Automation Tool for Companion
        </h1>
        <p className='subtext'>
          Streamline your production workflow with timed triggers.
        </p>

        <div className='action-buttons'>
          <button className='primary-button' onClick={handleGetStarted}>{hasGotStarted ? 'My Projects' : 'Get Started'} <ArrowRightIcon size={21} strokeWidth={2.4} /></button>
          <a className='secondary-button' onClick={() => scrollToSection('features')}>Learn more</a>
        </div>

        <img className='showcase-image' src='/codirectShowcaseImage.png' />

        <div style={{ marginTop: '4.5rem' }} className='divider' />

        <div className='cards-container'>
          <div className='card'>
            <p className='title'>No Account Needed</p>
            <div className='icons'>
              <div className='icon-container'>
                <CheckCheckIcon size={26} />
              </div>
            </div>
          </div>

          <div className='card'>
            <p className='title'>Free and Open-Source</p>
            <div className='icons'>
              <div className='icon-container secondary' onClick={() => window.open('https://github.com/codirect/codirect', '_blank', 'noopener,noreferrer')}>
                <FaGithub size={22} />
              </div>
              <div className='icon-container'>
                <CheckCheckIcon size={26} />
              </div>
            </div>
          </div>

          <div className='card'>
            <p className='title'>Community driven</p>
            <div className='icons'>
              <div className='icon-container secondary' onClick={() => window.open('https://discord.gg/TVh2bbYx', '_blank', 'noopener,noreferrer')}>
                <FaDiscord size={22} />
              </div>
              <div className='icon-container'>
                <CheckCheckIcon size={26} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="features" className='section' style={{ marginTop: '14rem' }}>
        <h1>
          Powerful Features
        </h1>
        <p className='subtext'>
          All the bells and whistles of coDIRECT
        </p>

        <div style={{ display: 'flex', flexDirection: 'row', gap: '4rem' }}>
          <div className='cards-container'>
            <div className='card'>
              <p className='title'>Connect with Bitfocus Companion</p>
              <div className='icons'>
                <div className='icon-container'>
                  <CheckCheckIcon size={26} />
                </div>
              </div>
            </div>

            <div className='card'>
              <p className='title'>Intuitive Timeline Editor</p>
              <div className='icons'>
                <div className='icon-container'>
                  <CheckCheckIcon size={26} />
                </div>
              </div>
            </div>

            <div className='card'>
              <p className='title'>Triggers with millisecond precision</p>
              <div className='icons'>
                <div className='icon-container'>
                  <CheckCheckIcon size={26} />
                </div>
              </div>
            </div>
          </div>

          <div className='cards-container'>
            <div className='card'>
              <p className='title'>Control small to huge productions</p>
              <div className='icons'>
                <div className='icon-container'>
                  <CheckCheckIcon size={26} />
                </div>
              </div>
            </div>

            <div className='card'>
              <p className='title'>Extensive documentation</p>
              <div className='icons'>
                <div className='icon-container'>
                  <CheckCheckIcon size={26} />
                </div>
              </div>
            </div>

            <div className='card'>
              <p className='title'>Local First</p>
              <div className='icons'>
                <div className='icon-container'>
                  <CheckCheckIcon size={26} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='action-buttons'>
          <button className='primary-button' onClick={handleGetStarted}>{hasGotStarted ? 'My Projects' : 'Get Started'} <ArrowRightIcon size={21} strokeWidth={2.4} /></button>
          <a className='secondary-button' onClick={() => window.open('https://vimeo.com/1202643763', '_blank')}>Watch showcase</a>
        </div>
      </div>

      <div id="contact" className='section' style={{ marginTop: '14rem', paddingBottom: '40vh' }}>
        <h1>
          Contact
        </h1>
        <p className='subtext' style={{ maxWidth: '620px' }}>
          Got something to say? Send us an email or jump on Discord. Always happy to chat
        </p>

        <div className='cards-container'>
          <div className='card'>
            <p className='title'>contact@codirect.live</p>
            <div className='icons'>
              <a
                href='mailto:contact@codirect.live'
                target='_blank'
                rel='noopener noreferrer'
                className='icon-container'
                style={{ color: 'white', cursor: 'pointer', display: 'inline-flex' }}
              >
                <MailIcon size={26} />
              </a>
            </div>
          </div>

          <div className='card'>
            <p className='title'>Discord Channel</p>
            <div className='icons'>
              <a
                href='https://discord.gg/TVh2bbYx'
                target='_blank'
                rel='noopener noreferrer'
                className='icon-container'
                style={{ color: 'white', cursor: 'pointer', display: 'inline-flex' }}
              >
                <FaDiscord size={26} />
              </a>
            </div>
          </div>
        </div>
      </div>

      <footer>
        <p className='license'>Licensed under the MIT License</p>
      </footer>
    </div >
  )
}

export default Landing