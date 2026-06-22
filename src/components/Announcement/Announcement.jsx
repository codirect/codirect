import React, { useState, useEffect } from 'react';
import './Announcement.css';

const ANNOUNCEMENT_URL = 'https://codirect.github.io/codirect-announcement/announcement.json'

function Announcement() {
  const [announcement, setAnnouncement] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        // Fetch the announcement from the URL
        const response = await fetch(ANNOUNCEMENT_URL, {cache: 'no-cache'});

        // Safely handle rate limits or server errors before parsing
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json();

        if (data && data.date) {
          const lastReadDate = localStorage.getItem('lastReadAnnouncementDate');
          // Only show if the announcement date is different from what was last closed
          if (lastReadDate !== data.date.toString()) {
            setAnnouncement(data);
            setIsVisible(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch announcement:", error);
      }
    };

    fetchAnnouncement();
  }, []);

  const handleClose = () => {
    if (announcement && announcement.date) {
      // Save the date so we don't show it again
      localStorage.setItem('lastReadAnnouncementDate', announcement.date.toString());
    }
    setIsVisible(false);
  };

  if (!isVisible || !announcement) return null;

  return (
    <div className="announcement-overlay">
      <div className="announcement-modal">
        <button className="announcement-close" onClick={handleClose} aria-label="Close announcement">
          &times;
        </button>
        <div className="announcement-content">
          <span className="announcement-badge">{announcement.label || "NEW UPDATE"}</span>
          <h2 className="announcement-title">{announcement.title}</h2>
          <p className="announcement-text">{announcement.content}</p>
          {announcement.date && <span className="announcement-date">{announcement.date}</span>}
        </div>
      </div>
    </div>
  );
}

export default Announcement;