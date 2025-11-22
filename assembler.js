// assembler.js - Assembler for Mano's Basic Computer

class Assembler {
    constructor() {
        // Symbol tables
        this.symbolTable = new Map();  // For labels and symbolic addresses
        this.locationCounter = 0;
        this.errors = [];

        // Instruction tables
        this.mriTable = {
            'AND': 0b000,
            'ADD': 0b001,
            'LDA': 0b010,
            'STA': 0b011,
            'BUN': 0b100,
            'BSA': 0b101,
            'ISZ': 0b110
        };

        this.nonMriTable = {
            // Register-reference instructions
            'CLA': 0x7800,
            'CLE': 0x7400,
            'CMA': 0x7200,
            'CME': 0x7100,
            'CIR': 0x7080,
            'CIL': 0x7040,
            'INC': 0x7020,
            'SPA': 0x7010,
            'SNA': 0x7008,
            'SZA': 0x7004,
            'SZE': 0x7002,
            'HLT': 0x7001,
            // I/O instructions (optional)
            'INP': 0xF800,
            'OUT': 0xF400,
            'SKI': 0xF200,
            'SKO': 0xF100,
            'ION': 0xF080,
            'IOF': 0xF040
        };

        this.pseudoInstructions = ['ORG', 'END', 'DEC', 'HEX'];
    }

    /**
     * Main assemble function - performs two-pass assembly
     * @param {string} sourceCode - Assembly source code
     * @returns {object} - {success: boolean, programData: [], errors: []}
     */
    assemble(sourceCode) {
        this.reset();
        const lines = this.preprocessCode(sourceCode);

        // First pass: build symbol table
        this.firstPass(lines);

        if (this.errors.length > 0) {
            return { success: false, programData: [], errors: this.errors, symbolTable: this.symbolTable };
        }

        // Second pass: generate machine code
        const programData = this.secondPass(lines);

        return { 
            success: this.errors.length === 0, 
            programData: programData, 
            errors: this.errors,
            symbolTable: this.symbolTable
        };
    }

    reset() {
        this.symbolTable.clear();
        this.locationCounter = 0;
        this.errors = [];
    }

    /**
     * Preprocess source code - remove comments, normalize whitespace
     */
    preprocessCode(sourceCode) {
        const lines = sourceCode.split('\n');
        const processed = [];

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // Remove comments (anything after / or #)
            const commentIndex = line.indexOf('/');
            if (commentIndex !== -1) {
                line = line.substring(0, commentIndex);
            }
            const hashIndex = line.indexOf('#');
            if (hashIndex !== -1) {
                line = line.substring(0, hashIndex);
            }

            line = line.trim();

            // Skip empty lines
            if (line.length === 0) continue;

            processed.push({
                lineNumber: i + 1,
                original: lines[i],
                text: line
            });
        }

        return processed;
    }

    /**
     * First pass: Build symbol table
     */
    firstPass(lines) {
        this.locationCounter = 0;

        for (const line of lines) {
            const tokens = this.tokenize(line.text);
            if (tokens.length === 0) continue;

            let tokenIndex = 0;

            // Check for label
            if (!this.isInstruction(tokens[0]) && !this.isPseudoInstruction(tokens[0])) {
                const label = tokens[0];

                // Check if label already exists
                if (this.symbolTable.has(label)) {
                    this.errors.push(`Line ${line.lineNumber}: Duplicate label '${label}'`);
                } else {
                    this.symbolTable.set(label, this.locationCounter);
                }

                tokenIndex = 1;
            }

            // Process instruction
            if (tokenIndex < tokens.length) {
                const instruction = tokens[tokenIndex];

                if (instruction === 'ORG') {
                    // ORG sets location counter
                    if (tokenIndex + 1 < tokens.length) {
                        const address = this.parseNumber(tokens[tokenIndex + 1]);
                        if (address !== null && address >= 0 && address < 4096) {
                            this.locationCounter = address;
                        } else {
                            this.errors.push(`Line ${line.lineNumber}: Invalid ORG address`);
                        }
                    } else {
                        this.errors.push(`Line ${line.lineNumber}: ORG requires an address`);
                    }
                } else if (instruction === 'END') {
                    // END terminates assembly
                    break;
                } else if (instruction === 'DEC' || instruction === 'HEX') {
                    // DEC/HEX reserve one memory location
                    this.locationCounter++;
                } else if (this.mriTable.hasOwnProperty(instruction) || this.nonMriTable.hasOwnProperty(instruction)) {
                    // Regular instruction
                    this.locationCounter++;
                } else {
                    this.errors.push(`Line ${line.lineNumber}: Unknown instruction '${instruction}'`);
                }
            }
        }
    }

    /**
     * Second pass: Generate machine code
     */
    secondPass(lines) {
        this.locationCounter = 0;
        const programData = [];

        for (const line of lines) {
            const tokens = this.tokenize(line.text);
            if (tokens.length === 0) continue;

            let tokenIndex = 0;

            // Skip label if present
            if (!this.isInstruction(tokens[0]) && !this.isPseudoInstruction(tokens[0])) {
                tokenIndex = 1;
            }

            // Process instruction
            if (tokenIndex < tokens.length) {
                const instruction = tokens[tokenIndex];

                if (instruction === 'ORG') {
                    if (tokenIndex + 1 < tokens.length) {
                        const address = this.parseNumber(tokens[tokenIndex + 1]);
                        if (address !== null) {
                            this.locationCounter = address;
                        }
                    }
                } else if (instruction === 'END') {
                    break;
                } else if (instruction === 'DEC') {
                    // DEC pseudo-instruction: store decimal number
                    if (tokenIndex + 1 < tokens.length) {
                        const value = this.parseNumber(tokens[tokenIndex + 1]);
                        if (value !== null) {
                            programData.push({
                                address: this.locationCounter,
                                instruction: value & 0xFFFF
                            });
                        } else {
                            this.errors.push(`Line ${line.lineNumber}: Invalid DEC value`);
                        }
                    } else {
                        this.errors.push(`Line ${line.lineNumber}: DEC requires a value`);
                    }
                    this.locationCounter++;
                } else if (instruction === 'HEX') {
                    // HEX pseudo-instruction: store hexadecimal number
                    if (tokenIndex + 1 < tokens.length) {
                        const value = this.parseNumber(tokens[tokenIndex + 1]);
                        if (value !== null) {
                            programData.push({
                                address: this.locationCounter,
                                instruction: value & 0xFFFF
                            });
                        } else {
                            this.errors.push(`Line ${line.lineNumber}: Invalid HEX value`);
                        }
                    } else {
                        this.errors.push(`Line ${line.lineNumber}: HEX requires a value`);
                    }
                    this.locationCounter++;
                } else if (this.nonMriTable.hasOwnProperty(instruction)) {
                    // Non-MRI instruction (register-reference or I/O)
                    const machineCode = this.nonMriTable[instruction];
                    programData.push({
                        address: this.locationCounter,
                        instruction: machineCode
                    });
                    this.locationCounter++;
                } else if (this.mriTable.hasOwnProperty(instruction)) {
                    // MRI instruction
                    const opcode = this.mriTable[instruction];
                    let address = 0;
                    let indirect = 0;

                    // Get address operand
                    if (tokenIndex + 1 < tokens.length) {
                        const operand = tokens[tokenIndex + 1];

                        // Check for indirect addressing (I)
                        if (tokenIndex + 2 < tokens.length && tokens[tokenIndex + 2] === 'I') {
                            indirect = 1;
                        }

                        // Parse address
                        const addr = this.parseAddress(operand);
                        if (addr !== null) {
                            address = addr;
                        } else {
                            this.errors.push(`Line ${line.lineNumber}: Invalid address '${operand}'`);
                        }
                    } else {
                        this.errors.push(`Line ${line.lineNumber}: MRI instruction '${instruction}' requires an address`);
                    }

                    // Construct machine code: [I][Opcode][Address]
                    // Bit 15: I, Bits 14-12: Opcode, Bits 11-0: Address
                    const machineCode = (indirect << 15) | (opcode << 12) | (address & 0xFFF);

                    programData.push({
                        address: this.locationCounter,
                        instruction: machineCode
                    });
                    this.locationCounter++;
                }
            }
        }

        return programData;
    }

    /**
     * Tokenize a line of assembly code
     */
    tokenize(line) {
        // Split by whitespace and commas
        return line.split(/[\s,]+/).filter(token => token.length > 0);
    }

    /**
     * Check if token is an instruction
     */
    isInstruction(token) {
        return this.mriTable.hasOwnProperty(token) || this.nonMriTable.hasOwnProperty(token);
    }

    /**
     * Check if token is a pseudo-instruction
     */
    isPseudoInstruction(token) {
        return this.pseudoInstructions.includes(token);
    }

    /**
     * Parse a number (decimal or hexadecimal)
     */
    parseNumber(str) {
        str = str.trim();

        // Hexadecimal (starts with 0x or just hex digits A-F)
        if (str.startsWith('0x') || str.startsWith('0X')) {
            const value = parseInt(str.substring(2), 16);
            return isNaN(value) ? null : value;
        }

        // Try hex first if contains A-F
        if (/[A-Fa-f]/.test(str)) {
            const value = parseInt(str, 16);
            return isNaN(value) ? null : value;
        }

        // Negative decimal
        if (str.startsWith('-')) {
            const value = parseInt(str, 10);
            if (isNaN(value)) return null;
            // Convert to 16-bit two's complement
            return (value & 0xFFFF);
        }

        // Positive decimal
        const value = parseInt(str, 10);
        return isNaN(value) ? null : value;
    }

    /**
     * Parse an address (number or symbol)
     */
    parseAddress(str) {
        // Try as number first
        const numValue = this.parseNumber(str);
        if (numValue !== null) {
            return numValue;
        }

        // Try as symbol
        if (this.symbolTable.has(str)) {
            return this.symbolTable.get(str);
        }

        return null;
    }

    /**
     * Convert program data to hex format for display
     */
    programDataToHex(programData) {
        let output = '';
        for (const entry of programData) {
            const addrHex = entry.address.toString(16).toUpperCase().padStart(3, '0');
            const instHex = entry.instruction.toString(16).toUpperCase().padStart(4, '0');
            output += `${addrHex} ${instHex}\n`;
        }
        return output;
    }

    /**
     * Generate symbol table listing
     */
    getSymbolTableListing() {
        let output = 'Symbol Table:\n';
        output += '=============\n';
        const symbols = Array.from(this.symbolTable.entries()).sort((a, b) => a[1] - b[1]);
        for (const [symbol, address] of symbols) {
            const addrHex = address.toString(16).toUpperCase().padStart(3, '0');
            output += `${symbol.padEnd(20)} ${addrHex} (${address})\n`;
        }
        return output;
    }
}

// Create global assembler instance
const assembler = new Assembler();
