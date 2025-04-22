;; Shipper Verification Contract
;; Validates legitimate exporters in the system

(define-data-var admin principal tx-sender)

;; Data map for storing shipper information
(define-map shippers
  principal
  {
    company-name: (string-utf8 100),
    registration-number: (string-utf8 50),
    country: (string-utf8 50),
    verified: bool,
    verification-date: uint
  }
)

;; Public function to register a new shipper
(define-public (register-shipper
                (company-name (string-utf8 100))
                (registration-number (string-utf8 50))
                (country (string-utf8 50)))
  (let ((shipper-principal tx-sender))
    ;; Check if shipper already exists - fixed the boolean check
    (if (is-some (map-get? shippers shipper-principal))
      (err u1) ;; Shipper already registered
      (ok (map-set shippers
                  shipper-principal
                  {
                    company-name: company-name,
                    registration-number: registration-number,
                    country: country,
                    verified: false,
                    verification-date: u0
                  }))
    )
  )
)

;; Admin function to verify a shipper
(define-public (verify-shipper (shipper-principal principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403)) ;; Only admin can verify
    (match (map-get? shippers shipper-principal)
      shipper-data (ok (map-set shippers
                               shipper-principal
                               (merge shipper-data
                                     {
                                       verified: true,
                                       verification-date: block-height
                                     })))
      (err u404) ;; Shipper not found
    )
  )
)

;; Public function to check if a shipper is verified
(define-read-only (is-verified-shipper (shipper-principal principal))
  (match (map-get? shippers shipper-principal)
    shipper-data (get verified shipper-data)
    false
  )
)

;; Public function to get shipper details
(define-read-only (get-shipper-details (shipper-principal principal))
  (map-get? shippers shipper-principal)
)

;; Admin function to transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (ok (var-set admin new-admin))
  )
)
