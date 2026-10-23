using System;
using System.IO;
using System.Text;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Collections.Generic;
using System.Web.Script.Serialization;

// Offline, deterministic movie renderer. No external services or generated maths.
public class BrickMovie {
 public static void Main(string[] args) {Render(args[0],args[1],args[2]);}
 const int W=960,H=540,FPS=12;
 static Color Ink=Color.FromArgb(34,61,55), Green=Color.FromArgb(54,139,112), Blue=Color.FromArgb(35,116,162), Orange=Color.FromArgb(206,108,47);
 static void Text(Graphics g,string value,float size,float x,float y,float width,Color color,bool bold=false) {
  using(var font=new Font("Segoe UI",size,bold?FontStyle.Bold:FontStyle.Regular,GraphicsUnit.Pixel))using(var brush=new SolidBrush(color))g.DrawString(value,font,brush,new RectangleF(x,y,width,150));
 }
 static void Box(Graphics g,float x,float y,float w,float h,Color color){using(var b=new SolidBrush(color))g.FillRectangle(b,x,y,w,h);}
 static void Brick(Graphics g,float x,float y,float w,float h,Color color,int studs=4){Box(g,x+4,y+6,w,h,Color.FromArgb(95,color));Box(g,x,y,w,h,color);using(var dark=new Pen(Color.FromArgb(100,Ink),2))g.DrawRectangle(dark,x,y,w,h);for(int i=0;i<studs;i++){float cx=x+(i+.5f)*w/studs;using(var b=new SolidBrush(ControlLight(color)))g.FillEllipse(b,cx-8,y-5,16,10);}}
 static Color ControlLight(Color c){return Color.FromArgb((c.R+255)/2,(c.G+255)/2,(c.B+255)/2);}
 static double Num(Dictionary<string,object> o,string k,double fallback=0){return o.ContainsKey(k)?Convert.ToDouble(o[k]):fallback;}
 static string Str(Dictionary<string,object> o,string k,string fallback=""){return o.ContainsKey(k)?Convert.ToString(o[k]):fallback;}
 static void Clock(Graphics g,double total,string focus,double arc) {
  float cx=595,cy=248,r=151;using(var bg=new SolidBrush(Color.FromArgb(255,254,248)))g.FillEllipse(bg,cx-r,cy-r,2*r,2*r);
  if(arc>0)using(var brush=new SolidBrush(Color.FromArgb(191,224,204)))g.FillPie(brush,cx-r+8,cy-r+8,2*r-16,2*r-16,-90,(float)(6*arc));
  using(var border=new Pen(Color.FromArgb(157,182,158),8))g.DrawEllipse(border,cx-r,cy-r,2*r,2*r);
  for(int i=0;i<60;i++){double a=i*Math.PI/30;float inner=i%5==0?r-17:r-11;using(var pen=new Pen(i%5==0?Ink:Color.Gray,i%5==0?3:1))g.DrawLine(pen,cx+(float)Math.Sin(a)*inner,cy-(float)Math.Cos(a)*inner,cx+(float)Math.Sin(a)*(r-5),cy-(float)Math.Cos(a)*(r-5));}
  for(int i=1;i<=12;i++){double a=i*Math.PI/6;Text(g,i.ToString(),24,cx+(float)Math.Sin(a)*(r-38)-15,cy-(float)Math.Cos(a)*(r-38)-18,40,Ink,true);}
  double t=((total%720)+720)%720,m=t%60,h=Math.Floor(t/60);double ha=(30*h+.5*m)*Math.PI/180,ma=6*m*Math.PI/180;
  using(var pen=new Pen(Orange,focus=="hour"?14:10)){pen.EndCap=LineCap.Round;g.DrawLine(pen,cx,cy,cx+(float)Math.Sin(ha)*77,cy-(float)Math.Cos(ha)*77);}
  using(var pen=new Pen(Blue,focus=="minute"?8:5)){pen.EndCap=LineCap.Round;g.DrawLine(pen,cx,cy,cx+(float)Math.Sin(ma)*127,cy-(float)Math.Cos(ma)*127);}
  using(var b=new SolidBrush(Ink))g.FillEllipse(b,cx-8,cy-8,16,16);
  if(focus=="count")for(int i=1;i<=12;i++){double a=i*Math.PI/6;Text(g,(i*5).ToString(),16,cx+(float)Math.Sin(a)*(r+26)-12,cy-(float)Math.Cos(a)*(r+26)-11,45,Blue,true);}
  string hh=(h==0?12:h).ToString(),mm=((int)m).ToString("00");Text(g,hh+":"+mm,34,545,401,200,Ink,true);
 }
 static void Strip(Graphics g,int n,int d,int units,float y,bool unequal,double divider) {
  float x=280,width=580,h=58;
  Text(g,"ONE WHOLE",18,x,y-35,width,Ink,true);
  float amount=unequal?.5f:(float)n/d;
  Box(g,x,y,width,h,Color.FromArgb(229,235,221));Box(g,x,y,width*amount,h,Green);
  using(var p=new Pen(Ink,2))g.DrawRectangle(p,x,y,width,h);
  for(int i=0;i<units;i++){float xx=x+(i+.5f)*width/units;using(var b=new SolidBrush(i<(unequal?units*.5:(double)n/d*units)?Color.FromArgb(160,207,183):Color.FromArgb(250,249,237)))g.FillEllipse(b,xx-7,y+19,14,14);}
  using(var p=new Pen(Color.FromArgb(Math.Max(30,(int)(255*divider)),Ink),4)){if(unequal){g.DrawLine(p,x+width/2,y,x+width/2,y+h);g.DrawLine(p,x+3*width/4,y,x+3*width/4,y+h);}else for(int i=1;i<d;i++)g.DrawLine(p,x+i*width/d,y,x+i*width/d,y+h);}
 }
 public static Bitmap Draw(Dictionary<string,object> movie,Dictionary<string,object> scene,double fraction,int number,int count) {
  var bmp=new Bitmap(W,H,PixelFormat.Format24bppRgb);using(var g=Graphics.FromImage(bmp)){g.SmoothingMode=SmoothingMode.AntiAlias;g.TextRenderingHint=System.Drawing.Text.TextRenderingHint.AntiAliasGridFit;g.Clear(Color.FromArgb(247,247,235));
  Text(g,"BRICK BY BRICK  /  MINI MOVIE",16,34,19,800,Green,true);Text(g,Str(movie,"title"),32,34,47,890,Ink,true);
  // Original generic interlocking-brick guide, not a branded character.
  Brick(g,53,225,110,78,Orange,3);Brick(g,65,315,88,68,Blue,3);Box(g,71,385,28,25,Ink);Box(g,121,385,28,25,Ink);
  using(var b=new SolidBrush(Ink)){g.FillEllipse(b,78,249,8,11);g.FillEllipse(b,128,249,8,11);}using(var p=new Pen(Ink,3))g.DrawArc(p,94,263,28,19,0,180);
  Text(g,Str(scene,"label"),24,34,114,220,Ink,true);
  string kind=Str(scene,"kind");double progress=Math.Min(1,Math.Max(0,fraction*2));progress=progress*progress*(3-2*progress);
  if(kind=="clock"||kind=="duration"){double end=Num(scene,"total"),start=Num(scene,"from",end);Clock(g,start+(end-start)*progress,Str(scene,"focus"),Num(scene,"arc"));}
  else {int n=(int)Num(scene,"n"),d=(int)Num(scene,"d",1),units=(int)Num(scene,"units",8);bool unequal=Num(scene,"unequal")==1;bool compare=scene.ContainsKey("d2");Strip(g,n,d,units,compare?200:245,unequal,scene.ContainsKey("subdivide")?.1+.9*progress:1);if(compare)Strip(g,(int)Num(scene,"n2"),(int)Num(scene,"d2"),units,340,false,1);
   Text(g,Str(scene,"equation",unequal?"These pieces are NOT equal":n+" / "+d),32,330,compare?410:330,550,Ink,true);
  }
  Box(g,0,452,W,88,Color.FromArgb(33,64,54));Text(g,Str(scene,"caption"),25,30,465,900,Color.White);
  Box(g,0,536,(float)(W*(number+fraction)/count),4,Color.FromArgb(231,186,79));
  }return bmp;
 }
 static void Four(BinaryWriter w,string s){w.Write(Encoding.ASCII.GetBytes(s));}
 static long Chunk(BinaryWriter w,string id){Four(w,id);w.Write(0);return w.BaseStream.Position;}
 static void End(BinaryWriter w,long start){long end=w.BaseStream.Position;w.BaseStream.Position=start-4;w.Write((uint)(end-start));w.BaseStream.Position=end;if((end-start)%2!=0)w.Write((byte)0);}
 public static void Render(string json,string avi,string poster) {
  var movie=new JavaScriptSerializer().Deserialize<Dictionary<string,object>>(File.ReadAllText(json));var scenes=(System.Collections.IList)movie["scenes"];int frames=0;foreach(Dictionary<string,object> s in scenes)frames+=(int)Math.Ceiling(Num(s,"seconds")*FPS);
  using(var stream=File.Create(avi))using(var w=new BinaryWriter(stream)){
   long riff=Chunk(w,"RIFF");Four(w,"AVI ");long hdrl=Chunk(w,"LIST");Four(w,"hdrl");long avih=Chunk(w,"avih");w.Write(1000000/FPS);w.Write(4000000);w.Write(0);w.Write(0x10);w.Write(frames);w.Write(0);w.Write(1);w.Write(0);w.Write(W);w.Write(H);for(int i=0;i<4;i++)w.Write(0);End(w,avih);
   long strl=Chunk(w,"LIST");Four(w,"strl");long strh=Chunk(w,"strh");Four(w,"vids");Four(w,"MJPG");w.Write(0);w.Write((short)0);w.Write((short)0);w.Write(0);w.Write(1);w.Write(FPS);w.Write(0);w.Write(frames);w.Write(0);w.Write(-1);w.Write(0);w.Write((short)0);w.Write((short)0);w.Write((short)W);w.Write((short)H);End(w,strh);
   long strf=Chunk(w,"strf");w.Write(40);w.Write(W);w.Write(H);w.Write((short)1);w.Write((short)24);Four(w,"MJPG");w.Write(W*H*3);for(int i=0;i<4;i++)w.Write(0);End(w,strf);End(w,strl);End(w,hdrl);
   long movi=Chunk(w,"LIST");Four(w,"movi");var offsets=new List<uint>();var sizes=new List<uint>();
   int number=0;foreach(Dictionary<string,object> s in scenes){int fcount=(int)Math.Ceiling(Num(s,"seconds")*FPS);for(int f=0;f<fcount;f++){using(var bmp=Draw(movie,s,(double)f/fcount,number,scenes.Count)){if(number==0&&f==0)bmp.Save(poster,ImageFormat.Png);using(var ms=new MemoryStream()){bmp.Save(ms,ImageFormat.Jpeg);var bytes=ms.ToArray();offsets.Add((uint)(w.BaseStream.Position-movi));sizes.Add((uint)bytes.Length);long frame=Chunk(w,"00dc");w.Write(bytes);End(w,frame);}}}number++;}
   End(w,movi);long index=Chunk(w,"idx1");for(int i=0;i<offsets.Count;i++){Four(w,"00dc");w.Write(0x10);w.Write(offsets[i]);w.Write(sizes[i]);}End(w,index);End(w,riff);
  }
 }
}

