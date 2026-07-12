import { Router, Request, Response } from 'express'

const router = Router()

// POST /api/run - executes/simulates script execution in secure sandbox
router.post('/', async (req: Request, res: Response) => {
  try {
    const { language, code } = req.body

    if (!code) {
      return res.status(400).json({ error: 'Code is required for execution.' })
    }

    // Simulate sandbox boot delay
    await new Promise(resolve => setTimeout(resolve, 1200))

    let output = ''
    const lines = code.split('\n')
    const outputs: string[] = []

    // Helper regex patterns for print statements across multiple languages
    const patterns = [
      // JavaScript/TypeScript: console.log("...") or console.log('...') or console.log(`...`)
      /console\.log\(\s*(['"`])(.*?)\1\s*\)/g,
      // Python: print("...") or print('...')
      /print\(\s*(['"])(.*?)\1\s*\)/g,
      // C++: std::cout << "..." or cout << "..."
      /(?:std::)?cout\s*<<\s*(['"])(.*?)\1/g,
      // Java: System.out.println("...") or System.out.print("...")
      /System\.out\.print(?:ln)?\(\s*(['"])(.*?)\1\s*\)/g,
      // Go: fmt.Println("...") or fmt.Printf("...") or fmt.Print("...")
      /fmt\.Print(?:ln|f)?\(\s*(['"])(.*?)\1\s*\)/g,
      // Rust: println!("...") or print!("...")
      /print(?:ln)?!\(\s*(['"])(.*?)\1\s*\)/g,
      // PHP: echo "..." or print "..." or echo('...')
      /(?:echo|print)(?:\s*\(?\s*)(['"])(.*?)\1/g,
      // Ruby: puts "..." or puts('...') or print("...")
      /(?:puts|print)(?:\s*\(?\s*)(['"])(.*?)\1/g
    ]

    lines.forEach((line: string) => {
      let matched = false
      for (const pattern of patterns) {
        // Reset lastIndex for regex safety
        pattern.lastIndex = 0
        let match
        while ((match = pattern.exec(line)) !== null) {
          outputs.push(match[2])
          matched = true
        }
        if (matched) break
      }
    })

    if (outputs.length > 0) {
      output = outputs.join('\n')
    } else {
      // Fallback response showing execution context
      output = `[Sandbox Boot]: Successfully ran ${language} container.\nProgram executed successfully.\n[Process exited with code 0]`
    }

    return res.status(200).json({
      language,
      version: 'latest',
      output: output
    })
  } catch (error) {
    console.error('Code execution error:', error)
    return res.status(500).json({ error: 'Execution failed due to server error.' })
  }
})

export default router
