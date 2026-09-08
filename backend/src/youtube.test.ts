import test from "node:test";
import assert from "node:assert/strict";
import {youtubeVideoId} from "./youtube.js";
import {articleSchema} from "./validation.js";
import {articleResponse} from "./serializers.js";
import {ObjectId} from "mongodb";

const id = "M7lc1UVf-VE";
const article = {title:"Example news title",excerpt:"Example news description",body:"A full article body for testing.",category:"News"};
test("supported YouTube links extract a safe video ID",()=>{
  for(const url of [`https://www.youtube.com/watch?v=${id}&t=30`, `https://youtu.be/${id}?si=abc`, `https://youtube.com/shorts/${id}`, `https://youtube.com/live/${id}`, `https://www.youtube-nocookie.com/embed/${id}`]) assert.equal(youtubeVideoId(url),id);
});
test("blank or unsafe links never become embeds",()=>{
  for(const url of [undefined,null,"","javascript:alert(1)",`https://youtube.com.evil.com/watch?v=${id}`,`https://evil.com/?v=${id}`,"https://youtube.com/playlist?list=123",`https://evil@youtube.com/watch?v=${id}`,"https://youtu.be/invalid"]) assert.equal(youtubeVideoId(url),null);
});
test("optional field can be saved, loaded and cleared",()=>{
  assert.equal(articleSchema.parse(article).youtube_url,undefined);
  const saved=articleSchema.parse({...article,youtube_url:`https://youtu.be/${id}`});
  assert.equal(saved.youtube_url,`https://www.youtube.com/watch?v=${id}`);
  assert.equal(articleResponse({_id:new ObjectId(),...saved},true).youtubeUrl,saved.youtube_url);
  const cleared=articleSchema.parse({...article,youtube_url:""});
  assert.equal(articleResponse({_id:new ObjectId(),...cleared},true).youtubeUrl,null);
  assert.equal(articleSchema.safeParse({...article,youtube_url:"https://example.com/video"}).success,false);
});
