"use client";

import { useState } from "react";
import Papa from "papaparse";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

/**
 * Upload Leads Page (MVC: View Layer)
 * 
 * Features:
 * - Drag & drop or click to upload CSV
 * - Parses CSV immediately using PapaParse (in browser)
 * - Shows a preview table of the parsed leads
 * - Sends data to /api/leads to save in the SQLite database
 */
export default function LeadsPage() {
  const [file, setFile] = useState(null);
  const [parsedLeads, setParsedLeads] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("idle"); // idle, success, error
  const [message, setMessage] = useState("");

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  // Parse CSV using PapaParse
  const parseCSV = (fileToParse) => {
    Papa.parse(fileToParse, {
      header: true,    // First row is headers
      skipEmptyLines: true,
      complete: (results) => {
        // Map CSV rows to our Lead model structure
        // Expecting: name, email, company, role
        const formattedLeads = results.data.map(row => ({
          name: row.name || row.Name || row.NAME || "",
          email: row.email || row.Email || row.EMAIL || "",
          company: row.company || row.Company || row.COMPANY || "",
          role: row.role || row.Role || row.ROLE || "",
        })).filter(lead => lead.name && lead.email); // Must have name and email

        setParsedLeads(formattedLeads);
        setUploadStatus("idle");
        setMessage(`Parsed ${formattedLeads.length} valid leads from CSV.`);
      },
      error: (error) => {
        console.error("CSV Parse Error:", error);
        setUploadStatus("error");
        setMessage("Error parsing CSV file. Please check the format.");
      }
    });
  };

  // Save parsed leads to database
  const handleUpload = async () => {
    if (parsedLeads.length === 0) return;

    setIsUploading(true);
    setUploadProgress(25);
    setUploadStatus("idle");

    try {
      setUploadProgress(50);
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: parsedLeads }),
      });

      setUploadProgress(80);
      const data = await response.json();

      if (response.ok && data.success) {
        setUploadProgress(100);
        setUploadStatus("success");
        setMessage(`Successfully saved ${parsedLeads.length} leads to the database!`);
        // Optional: clear file after success
        // setFile(null);
        // setParsedLeads([]);
      } else {
        throw new Error(data.error || "Failed to upload leads");
      }
    } catch (error) {
      console.error("Upload Error:", error);
      setUploadStatus("error");
      setMessage(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-grid bg-radial-gradient">
      <Navbar />
      
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Upload Leads</h1>
          <p className="mt-2 text-muted-foreground">
            Import your contacts via CSV to build your outreach audience.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Left Column: Upload Controls */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">Import CSV</CardTitle>
                <CardDescription>
                  Your CSV must include <code className="bg-muted px-1 py-0.5 rounded text-xs">name</code> and <code className="bg-muted px-1 py-0.5 rounded text-xs">email</code> columns.
                  <br/><br/>
                  Optional columns: <code className="bg-muted px-1 py-0.5 rounded text-xs">company</code>, <code className="bg-muted px-1 py-0.5 rounded text-xs">role</code>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* File Input Area */}
                <div className="flex w-full items-center justify-center">
                  <label htmlFor="dropzone-file" className={`flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${file ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}>
                    <div className="flex flex-col items-center justify-center pb-6 pt-5">
                      <span className="mb-3 text-3xl">📄</span>
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">{file ? file.name : "Click to upload"}</span>
                      </p>
                      {!file && <p className="text-xs text-muted-foreground">CSV (MAX. 10MB)</p>}
                    </div>
                    <input id="dropzone-file" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Uploading to database...</span>
                      <span className="font-medium">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
                
                {message && (
                  <div className={`rounded-md p-3 text-sm ${uploadStatus === 'success' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : uploadStatus === 'error' ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-muted text-muted-foreground'}`}>
                    {message}
                  </div>
                )}

              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full gap-2" 
                  onClick={handleUpload} 
                  disabled={parsedLeads.length === 0 || isUploading}
                >
                  {isUploading ? (
                     <span className="animate-spin text-lg leading-none">⚙️</span>
                  ) : (
                    <span>💾</span>
                  )}
                  {isUploading ? "Saving..." : `Save ${parsedLeads.length} Leads`}
                </Button>
              </CardFooter>
            </Card>

            {/* Sample File Download Helper */}
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
               <CardHeader className="pb-3">
                 <CardTitle className="text-sm">Need a sample file?</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="rounded-md bg-muted p-3 text-xs font-mono overflow-x-auto">
                   name,email,company,role<br/>
                   John,john@tesla.com,Tesla,CTO<br/>
                   Sarah,sarah@openai.com,OpenAI,Engineer
                 </div>
               </CardContent>
            </Card>
          </div>

          {/* Right Column: Preview Table */}
          <div className="lg:col-span-2">
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm shadow-sm h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-xl">Preview</CardTitle>
                  <CardDescription>Verify your data before saving</CardDescription>
                </div>
                <Badge variant="outline">
                  {parsedLeads.length} Row{parsedLeads.length !== 1 ? 's' : ''}
                </Badge>
              </CardHeader>
              <CardContent className="flex-1 overflow-x-auto min-h-[400px]">
                {parsedLeads.length > 0 ? (
                  <div className="rounded-md border border-border/50">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Role</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedLeads.slice(0, 10).map((lead, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{lead.name}</TableCell>
                            <TableCell>{lead.email}</TableCell>
                            <TableCell className="text-muted-foreground">{lead.company || "-"}</TableCell>
                            <TableCell className="text-muted-foreground">{lead.role || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {parsedLeads.length > 10 && (
                      <div className="p-3 text-center text-sm text-muted-foreground border-t border-border/50 bg-muted/20">
                        Showing 10 of {parsedLeads.length} parsed leads
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-md border border-dashed border-border/50 bg-muted/10 text-center">
                    <span className="mb-4 text-4xl">👀</span>
                    <h3 className="text-lg font-medium">No data to preview</h3>
                    <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                      Upload a CSV file to see a preview of how your leads will be imported.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
