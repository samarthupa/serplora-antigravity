import React from 'react';

export default function ActivityBar({
  activeView,
  setActiveView,
  isConsoleOpen,
  setIsConsoleOpen,
  handleReset,
  handleShare,
  isSharing,
  showConsole = true,
  isSettingsOpen,
  setIsSettingsOpen,
  isDownloadOpen,
  setIsDownloadOpen
}: any) {
  return (
    <div className="w-11 bg-gray-100 dark:bg-[#2d2d2d] flex flex-col items-center pt-1 shrink-0 transition-colors border-l border-r border-gray-300 dark:border-[#3c3c3c]">

      {/* TOP SECTION (Search Only) */}
      <div className="flex flex-col items-center w-full">
        <div
          className={`w-12 h-12 flex items-center justify-center cursor-pointer relative transition-colors ${
            activeView === 'search'
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-[#858585] hover:text-gray-800 dark:hover:text-[#cccccc]'
          }`}
          onClick={() => setActiveView(activeView === 'search' ? null : 'search')}
          title="Search"
        >
          {activeView === 'search' && (
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#007acc]"></div>
          )}

          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <circle cx="11" cy="11" r="9"></circle>
            <line x1="18" y1="18" x2="23" y2="23"></line>
          </svg>
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className="gap-2 pb-2 flex flex-col items-center w-full">

        {/* Download Icon */}
        <div
          className={`w-12 h-12 flex items-center justify-center cursor-pointer relative transition-colors ${
            isDownloadOpen
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-500 dark:text-[#858585] hover:text-gray-800 dark:hover:text-[#cccccc]'
          }`}
          title="Export Workspace"
          onClick={() => setIsDownloadOpen(!isDownloadOpen)}
        >
          {isDownloadOpen && (
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#007acc]"></div>
          )}

          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </div>

        {/* Reset Icon */}
        <div
          className="w-12 h-12 flex items-center justify-center cursor-pointer text-gray-500 dark:text-[#858585] hover:text-gray-800 dark:hover:text-[#cccccc]"
          title="Reset Compiler"
          onClick={handleReset}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-5 h-5"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </div>

        {/* Share Icon */}
        <div
          className={`w-12 h-12 flex items-center justify-center cursor-pointer transition-colors ${
            isSharing
              ? 'text-[#007acc] animate-pulse'
              : 'text-gray-500 dark:text-[#858585] hover:text-gray-800 dark:hover:text-[#cccccc]'
          }`}
          title="Share Workspace"
          onClick={!isSharing ? handleShare : undefined}
        >
          {isSharing ? (
            <svg
              className="w-5 h-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
          )}
        </div>

        {/* Console Icon */}
        {showConsole && (
          <div
            className={`w-12 h-12 flex items-center justify-center cursor-pointer relative transition-colors ${
              isConsoleOpen
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-[#858585] hover:text-gray-800 dark:hover:text-[#cccccc]'
            }`}
            title="Console"
            onClick={() => setIsConsoleOpen(!isConsoleOpen)}
          >
            {isConsoleOpen && (
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#007acc]"></div>
            )}

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <polyline points="4 17 10 11 4 5"></polyline>
              <line x1="12" y1="19" x2="20" y2="19"></line>
            </svg>
          </div>
        )}
      </div>

      {/* Settings Icon */}
      <div
        className={`w-12 h-12 flex items-center justify-center cursor-pointer relative transition-colors mt-auto mb-2 ${
          isSettingsOpen
            ? 'text-gray-900 dark:text-white'
            : 'text-gray-500 dark:text-[#858585] hover:text-gray-800 dark:hover:text-[#cccccc]'
        }`}
        title="Settings"
        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
      >
        {isSettingsOpen && (
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#007acc]"></div>
        )}

        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </div>
    </div>
  );
}