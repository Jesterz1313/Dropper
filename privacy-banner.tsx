'use client'

import React, { useState, useEffect } from 'react'

export default function PrivacyBanner() {
  const [isOpen, setIsOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const consented = localStorage.getItem('dropper_privacy_consent')
    if (!consented) {
      setIsOpen(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('dropper_privacy_consent', 'true')
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 bg-[#0c1324]/95 border border-blue-900/50 backdrop-blur-md p-4 rounded-2xl shadow-2xl transition-all">
        <div className="text-xs text-slate-300 space-y-2">
          <p>
            Мы собираем только необходимые данные (email, клики по социальным сетям) для предоставления доступа к загрузкам и аналитики релизов.
          </p>
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="text-blue-400 hover:text-blue-300 underline font-medium"
            >
              Подробнее
            </button>
            <button
              type="button"
              onClick={handleAccept}
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold px-4 py-1.5 rounded-xl transition-all shadow-md"
            >
              Принять
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0c1324] border border-blue-900/60 rounded-3xl p-6 md:p-8 max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl text-slate-200">
            <h2 className="text-lg font-bold text-white mb-4">Политика конфиденциальности</h2>
            
            <div className="space-y-3 text-xs leading-relaxed overflow-y-auto pr-2 text-slate-300">
              <p>
                <strong>1. Сбор данных:</strong> Сервис Dropper собирает адреса электронной почты и данные о подтверждении подписок на социальные платформы (Spotify, SoundCloud, Instagram, Telegram) исключительно в целях предоставления доступа к файлам для скачивания.
              </p>
              <p>
                <strong>2. Использование:</strong> Полученные контактные данные могут использоваться создателями релизов для информирования о новых музыкальных треках и мероприятиях.
              </p>
              <p>
                <strong>3. Безопасность:</strong> Мы не передаем ваши данные третьим лицам и обеспечиваем их сохранность в зашифрованных базах данных.
              </p>
              <p>
                <strong>4. Ваши права:</strong> Вы можете запросить удаление своего адреса электронной почты из базы в любой момент, обратившись к администратору сервиса.
              </p>
            </div>

            <div className="pt-6 mt-auto flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-xs text-slate-400 hover:text-white px-4 py-2"
              >
                Закрыть
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  handleAccept()
                }}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl transition-all"
              >
                Принять и закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}