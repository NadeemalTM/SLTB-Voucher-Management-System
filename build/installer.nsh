; NSIS installer script for SLTB Payment Voucher System
; This file customizes the installer appearance and behavior

; Custom installer pages
!macro customInit
    ; Check if running on Windows 10 or later
    ${If} ${AtLeastWin10}
        ; Good to go
    ${Else}
        MessageBox MB_OK|MB_ICONSTOP "This application requires Windows 10 or later to run properly."
        Quit
    ${EndIf}
!macroend

; Custom welcome page text
!macro customWelcomePage
    !define MUI_WELCOMEPAGE_TITLE "Welcome to SLTB Payment Voucher System Setup"
    !define MUI_WELCOMEPAGE_TEXT "This wizard will guide you through the installation of SLTB Payment Voucher System.$\r$\n$\r$\nThis is the official desktop application for Sri Lanka Tea Board payment voucher management.$\r$\n$\r$\nClick Next to continue."
!macroend

; Custom finish page
!macro customFinishPage
    !define MUI_FINISHPAGE_TITLE "SLTB Payment Voucher System Installation Complete"
    !define MUI_FINISHPAGE_TEXT "SLTB Payment Voucher System has been successfully installed on your computer.$\r$\n$\r$\nYou can now create, manage, and print professional payment vouchers.$\r$\n$\r$\nClick Finish to close this wizard."
    !define MUI_FINISHPAGE_RUN "$INSTDIR\SLTB Payment Voucher System.exe"
    !define MUI_FINISHPAGE_RUN_TEXT "Launch SLTB Payment Voucher System"
!macroend