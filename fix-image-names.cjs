const fs = require('fs');
let code = fs.readFileSync('backend/src/routes/articles.ts', 'utf8');

code = code.replace(
  'async function saveImage(file:Express.Multer.File){file = await optimizeImage(file);const stream=articleImages.openUploadStream(file.originalname,{contentType:file.mimetype});await new Promise<void>((resolve,reject)=>Readable.from(file.buffer).pipe(stream).once("error",reject).once("finish",()=>resolve()));return stream.id}',
  'async function saveImage(file:Express.Multer.File, slug?:string){file = await optimizeImage(file);let finalName = file.originalname; if(slug) { const ext = finalName.includes(".") ? finalName.substring(finalName.lastIndexOf(".")) : ""; finalName = slug + ext; } const stream=articleImages.openUploadStream(finalName,{contentType:file.mimetype});await new Promise<void>((resolve,reject)=>Readable.from(file.buffer).pipe(stream).once("error",reject).once("finish",()=>resolve()));return stream.id}'
);

code = code.replace(
  'if(request.file){imageId=await saveImage(request.file);document.image_file_id=imageId',
  'if(request.file){imageId=await saveImage(request.file, document.slug);document.image_file_id=imageId'
);

code = code.replace(
  'if(request.file){newImageId=await saveImage(request.file);updates.image_file_id=newImageId',
  'if(request.file){newImageId=await saveImage(request.file, updates.slug as string);updates.image_file_id=newImageId'
);

fs.writeFileSync('backend/src/routes/articles.ts', code);
console.log("Updated saveImage in articles.ts");
