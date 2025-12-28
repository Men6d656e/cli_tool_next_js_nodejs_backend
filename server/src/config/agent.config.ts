import { promises as fs } from "fs";
import path from "path";
import chalk from "chalk";
import { generateObject } from "ai";
import z from "zod";

const ApplicationSchema = z.object({
  folderName: z.string().describe("Kabab-Case folder name for the application"),
  description: z.string().describe("Briefdescription of what was created"),
  files: z.array(
    z
      .object({
        path: z.string().describe("Relative file path (e.g src/App.jsx)"),
        content: z.string().describe("Compelete File Content"),
      })
      .describe("All files needed for the applications")
  ),
  setupCommands: z.array(
    z
      .string()
      .describe(
        "Bash commands to setup and run ( e.g: npm install, npm run dev )"
      )
  ),
  dependencies: z
    .record(z.string())
    .optional()
    .describe("NPM dependencies with versions"),
});

function prinstSystem(message) {
  console.log(message);
}

function displayFileTree(files, folderName) {
  prinstSystem(chalk.cyan(`\n Project Structure:`));
  prinstSystem(chalk.white(`${folderName}`));

  const filesByDir = {};
  files.forEach((file) => {
    const parts = file.path.split("/");
    const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : "";

    if (!filesByDir[dir]) {
      filesByDir[dir] = [];
    }
    filesByDir[dir].push(parts[parts.length - 1]);
  });
  Object.keys(filesByDir)
    .sort()
    .forEach((dir) => {
      if (dir) {
        prinstSystem(chalk.white(`- ${dir}/`));
        filesByDir[dir].forEach((file) => {
          prinstSystem(chalk.white(`|-- ${files}`));
        });
      } else {
        filesByDir[dir].forEach((file) => {
          prinstSystem(chalk.white(`|-- ${file}`));
        });
      }
    });
}

async function createApplicationFiles(
  baseDir: string,
  folderName: string,
  files: string
) {
  const appDir = path.join(baseDir, folderName);

  await fs.mkdir(appDir, { recursive: true });
  prinstSystem(chalk.cyan(`\n Created directory: ${folderName}`));

  for (const file of files) {
    const filePath = path.join(appDir, file.path);
    const fileDir = path.dirname(filePath);
    await fs.writeFile(fileDir, { recursive: true });
    await fs.writeFile(filePath, file.content, "utf-8");
    prinstSystem(chalk.green(` ${file.path}`));
  }
  return appDir;
}

export async function generateApplication(
  description,
  aiService,
  cwd = process.cwd()
) {
  try {
    prinstSystem(chalk.cyan(`\n Agent Mode: Generating your application...\n`));
    prinstSystem(chalk.gray(`Request: ${description}\n`));

    prinstSystem(chalk.magenta("Agent Response:\n"));
    const { object: application } = await generateObject({
      model: aiService.model,
      schema: ApplicationSchema,
      prompt: `
    Create a complete, production-ready application for: ${description}
    
    CRITICAL REQUIRMENTS:
    1. Generate ALL files needed for the application to run
    2. Include package.json with All dependencies and correct version
    3. Include READEME.md with setup instructions
    4. Include configuration files (.gitignore, etc.)
    5. Write clean, well-commented, production-ready code
    6. Include error handling and input validation
    7. use modern JavaScript/TypeScript best practices
    8. Make sure all important and paths are correct
    9. NO PLACEHOLDERS - every thing must be complete and working

    Provide:
    - A meaningful kabab-case folder name
    - All necessary files with complete content
    - Setup commands (cd folder, npm install, npm run dev, etc.)
    - All dependencies with version
        
        `,
    });

    prinstSystem(chalk.green(`\n Generated: ${application.folderName}\n`));
    prinstSystem(chalk.gray(`\n Description: ${application.description}\n`));

    if (application.files.length === 0) {
      throw new Error("No files were genrated");
    }

    displayFileTree(application.files, application.folderName);

    // create application directry and files
    prinstSystem(chalk.cyan("\n Creating files...\n"));
    const appDir = await createApplicationFiles(
      cwd,
      application.folderName,
      application.files
    );

    prinstSystem(chalk.cyan(`Application created successfully!\n`));
    prinstSystem(chalk.cyan(`Location: ${chalk.bold(appDir)}`));

    if (application.setupCommands.length > 0) {
      prinstSystem(chalk.cyan(`Next steps:\n`));
      prinstSystem(chalk.white("```bash"));
      application.setupCommands.forEach((cmd) => {
        prinstSystem(chalk.white(cmd));
      });
      prinstSystem(chalk.white("```\n"));
    }
    return {
      folderName: application.folderName,
      appDir,
      files: application.files.map((f) => f.path),
      commands: application.setupCommands,
      success: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : error;
    prinstSystem(chalk.red(`\n Error generating application: ${message}`));
    if (error instanceof Error && error.stack) {
      prinstSystem(chalk.dim(error.stack + "\n"));
    }
    throw error;
  }
}
