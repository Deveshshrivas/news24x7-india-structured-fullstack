param([Parameter(Mandatory=$true)][string]$Stage,[Parameter(Mandatory=$true)][string]$MediaRoot,[Parameter(Mandatory=$true)][string]$Target)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -TypeDefinition @'
using System;
using System.IO;
using System.IO.Compression;
public static class LargeProjectZip {
 public static void Create(string stage,string media,string target){
  using(var stream=new FileStream(target,FileMode.CreateNew,FileAccess.Write,FileShare.None,65536))
  using(var zip=new ZipArchive(stream,ZipArchiveMode.Create)){
   Add(zip,stage,"");
   Add(zip,media,"uploads/");
  }
 }
 static void Add(ZipArchive zip,string directory,string prefix){
  string root=Path.GetFullPath(directory).TrimEnd(Path.DirectorySeparatorChar)+Path.DirectorySeparatorChar;
  int count=0;
  byte[] buffer=new byte[65536];
  foreach(string file in Directory.EnumerateFiles(root,"*",SearchOption.AllDirectories)){
   if((File.GetAttributes(file)&FileAttributes.ReparsePoint)!=0)throw new IOException("Symbolic links are not supported");
   string name=prefix+file.Substring(root.Length).Replace('\\','/');
   var entry=zip.CreateEntry(name,CompressionLevel.NoCompression);
   using(var input=File.OpenRead(file))using(var output=entry.Open()){
    int length;while((length=input.Read(buffer,0,buffer.Length))>0)output.Write(buffer,0,length);
   }
   if(++count%10000==0)Console.WriteLine("Packed "+count+" files from "+prefix);
  }
 }
}
'@ -ReferencedAssemblies System.IO.Compression,System.IO.Compression.FileSystem
[LargeProjectZip]::Create($Stage,$MediaRoot,$Target)
Write-Output "FULL PRIVATE ZIP READY: $Target"
