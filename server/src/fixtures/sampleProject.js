/**
 * Built-in safe demonstration fixtures for CodeSentry AI.
 * Contains realistic vulnerabilities and logic bugs for instant testing and hackathon judging.
 */

export const SAMPLE_REPOSITORIES = [
  {
    id: 'demo-ecommerce-api',
    name: 'vulnerable-ecommerce-microservice',
    description: 'Realistic Node.js e-commerce service with SQL injection, prototype pollution, discount logic flaw, and path traversal.',
    files: [
      {
        path: 'src/services/authService.js',
        language: 'javascript',
        content: `// Authentication Service
import crypto from 'crypto';

// Hardcoded secret key for JWT signing - Critical Security Flaw
const JWT_SECRET = "super_secret_production_key_99887766";

export class AuthService {
  constructor(db) {
    this.db = db;
  }

  // Vulnerable to SQL Injection via dynamic string concatenation
  async authenticateUser(username, password) {
    const query = "SELECT id, username, role FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
    console.log("Executing query:", query);
    
    // Simulate database lookup
    const user = await this.db.rawQuery(query);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    return {
      token: crypto.createHmac('sha256', JWT_SECRET).update(user.id).digest('hex'),
      user: { id: user.id, username: user.username, role: user.role }
    };
  }
}
`,
      },
      {
        path: 'src/services/paymentService.js',
        language: 'javascript',
        content: `// Payment & Checkout Calculation Service

export class PaymentService {
  /**
   * Calculates final order total after applying discounts and taxes.
   * Bug: Flawed percentage calculation and missing boundary checks allow negative total.
   */
  calculateOrderTotal(items, discountCode, taxRate = 0.08) {
    let subtotal = 0;

    for (const item of items) {
      // Off-by-one or unchecked price logic
      subtotal += item.price * item.quantity;
    }

    let discountPercentage = 0;
    if (discountCode === 'SAVE50') {
      discountPercentage = 0.50;
    } else if (discountCode === 'SUPERDISCOUNT150') {
      // Vulnerability: discount exceeds 100%, causing negative checkout!
      discountPercentage = 1.50;
    }

    const discountAmount = subtotal * discountPercentage;
    const discountedTotal = subtotal - discountAmount;

    // Fails to enforce minimum price >= 0
    const finalWithTax = discountedTotal + (discountedTotal * taxRate);

    return {
      subtotal,
      discountAmount,
      total: Math.round(finalWithTax * 100) / 100
    };
  }

  /**
   * Calculates reward points multiplier
   * Bug: Division by zero when tier level is 0
   */
  calculateRewardRatio(points, tierLevel) {
    // Unchecked division
    return points / tierLevel;
  }
}
`,
      },
      {
        path: 'src/utils/objectMerger.js',
        language: 'javascript',
        content: `// Deep merge utility
/**
 * Vulnerable to Prototype Pollution.
 * Does not sanitize __proto__, constructor, or prototype properties.
 */
export function deepMerge(target, source) {
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        if (!target[key]) {
          target[key] = {};
        }
        deepMerge(target[key], source[key]);
      } else {
        // Prototype pollution trigger: target[key] can pollute Object.prototype
        target[key] = source[key];
      }
    }
  }
  return target;
}
`,
      },
      {
        path: 'src/controllers/reportController.js',
        language: 'javascript',
        content: `// Report Controller
import fs from 'fs';
import path from 'path';

const REPORTS_DIR = '/var/data/reports';

export function getReportFile(userInputFilename) {
  // Path traversal vulnerability: user can pass "../../etc/passwd"
  const targetPath = path.join(REPORTS_DIR, userInputFilename);
  
  if (!fs.existsSync(targetPath)) {
    throw new Error("File not found");
  }

  return fs.readFileSync(targetPath, 'utf8');
}
`,
      },
    ],
  },
];
