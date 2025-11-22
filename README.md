# Mano's Basic Computer Simulator

## Overview
This is a web-based simulator for Mano's Basic Computer as described in "Computer System Architecture (3rd Edition)". The simulator provides a complete interactive implementation of the computer architecture with visual feedback and detailed execution control.

## Features

### Core Features
- **Complete instruction cycle implementation** (Fetch-Decode-Execute)
- **All Memory-Reference instructions**: AND, ADD, LDA, STA, BUN, BSA, ISZ
- **All Register-Reference instructions**: CLA, CLE, CMA, CME, CIR, CIL, INC, SPA, SNA, SZA, SZE, HLT
- **Direct and Indirect addressing modes**
- **Cycle-level and instruction-level execution control**
- **Real-time register and memory inspection**
- **Profiler with CPI and memory bandwidth metrics**

### Bonus Features (GUI)
- **Interactive datapath visualization** with animated register updates
- **Component highlighting** - registers flash when changed
- **Detailed register display** showing hex, binary, and decimal values
- **Memory viewer** with hex, binary, and decimal representation
- **Command-line interface** for inspection commands
- **Real-time execution status** display
- **Profiler statistics** dashboard

## How to Use

### Getting Started
1. Open `index.html` in a modern web browser
2. Load a program using one of these methods:
   - Upload a `program.txt` file
   - Enter program hex manually in the text area
   - Use one of the sample programs provided

### Program Format
Programs should be in the format:
```
address instruction
```
Example:
```
000 2100
001 1101
002 7001
```

### Execution Controls

#### Cycle-Level Control
- **Next Cycle**: Execute one clock cycle (T0, T1, T2, etc.)
- **Fast Cycle N**: Execute N clock cycles in sequence

#### Instruction-Level Control
- **Next Instruction**: Execute one complete instruction
- **Fast Instruction N**: Execute N complete instructions

#### Program-Level Control
- **Run**: Execute until HLT instruction (0x7001) is encountered
- **Reset**: Reset computer to initial state

### Inspection Commands

Type commands in the command input box:

- `show AC` - Display AC register
- `show DR` - Display DR register
- `show AR` - Display AR register
- `show PC` - Display PC register
- `show IR` - Display IR register
- `show TR` - Display TR register
- `show E` - Display E flag
- `show I` - Display I flag
- `show all` - Display all registers and flags
- `show mem 100` - Display memory at address 0x100
- `show mem 100 5` - Display 5 memory locations starting at 0x100
- `show profiler` - Display profiler statistics

### Memory Viewer
- Enter start address (hex format, e.g., "100" or "0x100")
- Enter count of locations to view
- Click "View Memory" to update the table

## Architecture Details

### Registers
- **AC** (16 bits): Accumulator - main processing register
- **DR** (16 bits): Data Register - holds operand from memory
- **AR** (12 bits): Address Register - holds memory address
- **PC** (12 bits): Program Counter - address of next instruction
- **IR** (16 bits): Instruction Register - holds current instruction
- **TR** (16 bits): Temporary Register - temporary storage
- **SC** (4 bits): Sequence Counter - timing control (T0-T15)

### Flip-flops
- **I**: Indirect addressing mode bit
- **E**: Extended AC bit (carry)
- **S**: Start-stop flip-flop
- **R**: Interrupt flip-flop
- **IEN**: Interrupt enable

### Memory
- 4096 words (0x000 to 0xFFF)
- 16 bits per word

### Instruction Format
```
| 15 | 14 13 12 | 11 10 9 8 7 6 5 4 3 2 1 0 |
|  I | Opcode   | Address                    |
```

- **I bit** (bit 15): 0 = Direct, 1 = Indirect
- **Opcode** (bits 12-14): Instruction operation code
- **Address** (bits 0-11): Memory address or operation specification

### Instruction Set

#### Memory-Reference Instructions
- **AND** (0xxx/8xxx): AC ← AC ∧ M[EA]
- **ADD** (1xxx/9xxx): AC ← AC + M[EA], E ← Cout
- **LDA** (2xxx/Axxx): AC ← M[EA]
- **STA** (3xxx/Bxxx): M[EA] ← AC
- **BUN** (4xxx/Cxxx): PC ← EA
- **BSA** (5xxx/Dxxx): M[EA] ← PC, PC ← EA + 1
- **ISZ** (6xxx/Exxx): M[EA] ← M[EA] + 1, skip if zero

#### Register-Reference Instructions
- **CLA** (7800): AC ← 0
- **CLE** (7400): E ← 0
- **CMA** (7200): AC ← AC'
- **CME** (7100): E ← E'
- **CIR** (7080): Circulate right AC and E
- **CIL** (7040): Circulate left AC and E
- **INC** (7020): AC ← AC + 1
- **SPA** (7010): Skip if AC > 0
- **SNA** (7008): Skip if AC < 0
- **SZA** (7004): Skip if AC = 0
- **SZE** (7002): Skip if E = 0
- **HLT** (7001): Halt computer



## Assembler

### Overview
The simulator now includes a **two-pass assembler** that translates assembly language programs into machine code. This matches the assembler described in Chapter 6 of Mano's Computer System Architecture.

### Supported Features

#### Memory-Reference Instructions (MRI)
- **AND** - AND memory word to AC
- **ADD** - Add memory word to AC  
- **LDA** - Load memory word to AC
- **STA** - Store content of AC in memory
- **BUN** - Branch unconditionally
- **BSA** - Branch and save return address
- **ISZ** - Increment and skip if zero

#### Register-Reference Instructions
- **CLA** - Clear AC
- **CLE** - Clear E
- **CMA** - Complement AC
- **CME** - Complement E
- **CIR** - Circulate right AC and E
- **CIL** - Circulate left AC and E
- **INC** - Increment AC
- **SPA** - Skip if AC positive
- **SNA** - Skip if AC negative
- **SZA** - Skip if AC zero
- **SZE** - Skip if E is 0
- **HLT** - Halt computer

#### Pseudo-Instructions
- **ORG N** - Origin: set location counter to address N
- **END** - End of assembly program
- **DEC N** - Decimal: store decimal number N
- **HEX N** - Hexadecimal: store hexadecimal number N

### Assembly Language Format

```
[LABEL,]  INSTRUCTION  [OPERAND]  [I]  [/COMMENT]
```

- **LABEL** (optional): Symbolic name ending with comma
- **INSTRUCTION**: Mnemonic (AND, LDA, HLT, etc.)
- **OPERAND** (optional): Address or value (symbolic or numeric)
- **I** (optional): Indirect addressing mode indicator
- **COMMENT** (optional): Begins with `/` or `#`

### Example Programs

#### Example 1: Simple Addition
```assembly
        ORG 100
START,  LDA NUM1        / Load first number
        ADD NUM2        / Add second number
        STA RESULT      / Store result
        HLT             / Halt computer
NUM1,   DEC 25          / First number (decimal 25)
NUM2,   DEC 17          / Second number (decimal 17)
RESULT, HEX 0           / Result location
        END
```

#### Example 2: Loop with ISZ
```assembly
        ORG 0
        LDA MONE        / Load -1
LOOP,   STA COUNT       / Store loop counter
        LDA VALUE       / Load value
        INC             / Increment value
        STA VALUE       / Store back
        ISZ COUNT       / Increment counter, skip if zero
        BUN LOOP        / Branch back to loop
        HLT             / Halt
MONE,   DEC -4          / Counter: -4 (loop 4 times)
COUNT,  HEX 0           / Counter storage
VALUE,  HEX 0           / Value to increment
        END
```

#### Example 3: Subroutine with BSA
```assembly
        ORG 100
BEGIN,  LDA X           / Load X
        BSA SUBR        / Call subroutine
        STA RESULT      / Store result
        HLT
X,      DEC 10
RESULT, HEX 0

/ Subroutine: Multiply by 2
        ORG 200
SUBR,   HEX 0           / Return address stored here
        CIL             / Circulate left (multiply by 2)
        BUN SUBR I      / Return (indirect)
        END
```

### Using the Assembler

1. **Write Assembly Code**: Enter your assembly program in the "Assembly Source Code" text area
2. **Assemble & Load**: Click "Assemble & Load" to assemble and load into memory
3. **Assemble Only**: Click "Assemble Only" to check for errors without loading
4. **View Symbol Table**: After assembly, the symbol table and machine code are displayed
5. **Execute**: Use the execution controls to run the assembled program

### Assembler Output

The assembler provides:
- **Symbol Table**: Lists all labels and their addresses
- **Machine Code**: Hex representation of assembled instructions
- **Error Messages**: Detailed error reporting with line numbers

### Number Formats

The assembler accepts numbers in multiple formats:
- **Decimal**: `25`, `-4`
- **Hexadecimal**: `ABCD`, `0xFFFF`, `0X1A2B`

### Addressing Modes

- **Direct**: `LDA NUM` - Access memory directly
- **Indirect**: `LDA NUM I` - Access memory indirectly (I flag)

### Sample Assembly Files

The project includes four sample assembly programs:
- `sample_asm1.txt` - Simple addition
- `sample_asm2.txt` - Loop with ISZ
- `sample_asm3.txt` - Subroutine with BSA
- `sample_asm4.txt` - AND operation and masking



## Sample Programs

### Program 1: Simple Addition
Adds two numbers from memory locations 0x100 and 0x101, stores result in 0x102.

### Program 2: Loop with ISZ
Demonstrates a counting loop using the ISZ (Increment and Skip if Zero) instruction.

### Program 3: Multiplication
Multiplies two numbers using repeated addition.

## Profiler Metrics

The simulator tracks:
- **Total Cycles**: Number of clock cycles executed
- **Instructions Executed**: Number of complete instructions
- **Average CPI**: Cycles per instruction
- **Memory Reads**: Number of memory read operations
- **Memory Writes**: Number of memory write operations
- **Memory Bandwidth**: Total memory accesses (reads + writes)

## Technical Stack

- **HTML5**: Structure and layout
- **CSS3**: Styling with modern gradients and animations
- **Tailwind**: Used to style the datapath
- **Vanilla JavaScript**: No dependencies, pure JavaScript implementation
- **SVG**: Datapath diagram and register visualization

## Browser Compatibility

Works best in modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Project Structure

```
basic-computer-simulator/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── computer.js         # Computer logic implementation
├── ui.js              # User interface logic
├── README.md          # This file
├── sample_program1.txt # Sample program 1
├── sample_program2.txt # Sample program 2
└── sample_program3.txt # Sample program 3
```

## Development Notes

This simulator accurately implements:
- The complete fetch-decode-execute cycle
- All timing sequences (T0-T6)
- Proper micro-operations for each instruction
- Memory read/write cycles
- Direct and indirect addressing
- All register-reference operations
- Profiler metrics calculation

## Author

COE 341 Project - Basic Computer Simulator
Based on Mano's Basic Computer from "Computer System Architecture (3rd Edition)"
Done by Adrish Danka, Fadil Imran, Prerana Ramkumar, and Rizwanul Abidin Asim

## License

Educational use only - COE 341 Project
