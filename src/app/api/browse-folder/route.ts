import { NextResponse } from "next/server";
import { execFile } from "child_process";

export async function GET() {
  try {
    const selectedPath = await openFolderDialog();
    if (!selectedPath) {
      return NextResponse.json({ cancelled: true });
    }
    return NextResponse.json({ path: selectedPath });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to open folder dialog";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function openFolderDialog(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const script = `
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = 'Select download folder'
$dialog.ShowNewFolderButton = $true
$result = $dialog.ShowDialog()
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
  Write-Output $dialog.SelectedPath
} else {
  Write-Output ''
}
    `.trim();

    execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", script],
      { timeout: 60000 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
          return;
        }
        const selected = stdout.trim();
        resolve(selected || null);
      }
    );
  });
}
