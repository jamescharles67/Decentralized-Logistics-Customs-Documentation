import { describe, it, expect, beforeEach } from "vitest"

// Mock the Clarity contract environment
const mockTxSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
const mockAdmin = mockTxSender
const mockShipper = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"

// Mock contract state
let shippers = new Map()
let admin = mockAdmin

// Mock contract functions
const registerShipper = (sender: string, companyName: string, registrationNumber: string, country: string) => {
  if (shippers.has(sender)) {
    return { type: "err", value: 1 }
  }
  
  shippers.set(sender, {
    "company-name": companyName,
    "registration-number": registrationNumber,
    country: country,
    verified: false,
    "verification-date": 0,
  })
  
  return { type: "ok", value: true }
}

const verifyShipper = (sender: string, shipperPrincipal: string) => {
  if (sender !== admin) {
    return { type: "err", value: 403 }
  }
  
  if (!shippers.has(shipperPrincipal)) {
    return { type: "err", value: 404 }
  }
  
  const shipperData = shippers.get(shipperPrincipal)
  shipperData.verified = true
  shipperData["verification-date"] = 123 // Mock block height
  shippers.set(shipperPrincipal, shipperData)
  
  return { type: "ok", value: true }
}

const isVerifiedShipper = (shipperPrincipal: string) => {
  if (!shippers.has(shipperPrincipal)) {
    return false
  }
  return shippers.get(shipperPrincipal).verified
}

const getShipperDetails = (shipperPrincipal: string) => {
  return shippers.get(shipperPrincipal) || null
}

const transferAdmin = (sender: string, newAdmin: string) => {
  if (sender !== admin) {
    return { type: "err", value: 403 }
  }
  
  admin = newAdmin
  return { type: "ok", value: true }
}

describe("Shipper Verification Contract", () => {
  beforeEach(() => {
    // Reset state before each test
    shippers = new Map()
    admin = mockAdmin
  })
  
  it("should register a new shipper", () => {
    const result = registerShipper(mockShipper, "Acme Shipping", "REG123456", "US")
    
    expect(result.type).toBe("ok")
    expect(shippers.has(mockShipper)).toBe(true)
    
    const shipperData = shippers.get(mockShipper)
    expect(shipperData["company-name"]).toBe("Acme Shipping")
    expect(shipperData.verified).toBe(false)
  })
  
  it("should not register the same shipper twice", () => {
    registerShipper(mockShipper, "Acme Shipping", "REG123456", "US")
    const result = registerShipper(mockShipper, "Acme Shipping 2", "REG789012", "US")
    
    expect(result.type).toBe("err")
    expect(result.value).toBe(1)
  })
  
  it("should verify a shipper when admin calls verify-shipper", () => {
    registerShipper(mockShipper, "Acme Shipping", "REG123456", "US")
    const result = verifyShipper(mockAdmin, mockShipper)
    
    expect(result.type).toBe("ok")
    expect(isVerifiedShipper(mockShipper)).toBe(true)
    
    const shipperData = getShipperDetails(mockShipper)
    expect(shipperData["verification-date"]).toBe(123)
  })
  
  it("should not allow non-admin to verify a shipper", () => {
    registerShipper(mockShipper, "Acme Shipping", "REG123456", "US")
    const result = verifyShipper(mockShipper, mockShipper)
    
    expect(result.type).toBe("err")
    expect(result.value).toBe(403)
    expect(isVerifiedShipper(mockShipper)).toBe(false)
  })
  
  it("should allow admin to transfer admin rights", () => {
    const newAdmin = "ST3AMRFNDS4VVSEK1TBBMXWF1EGQEPRV7SP1M3YF4"
    const result = transferAdmin(mockAdmin, newAdmin)
    
    expect(result.type).toBe("ok")
    expect(admin).toBe(newAdmin)
    
    // Old admin should no longer have admin rights
    const secondResult = transferAdmin(mockAdmin, mockShipper)
    expect(secondResult.type).toBe("err")
    expect(secondResult.value).toBe(403)
  })
})
