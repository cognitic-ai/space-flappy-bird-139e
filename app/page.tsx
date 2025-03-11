import SpaceFlappyBird from "@/components/SpaceFlappyBird";
export default function Home() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold text-center mb-6">Space Flappy Bird</h1>
      <p className="text-center mb-8">Use spacebar or click to make the bird flap!</p>
      <SpaceFlappyBird />
    </div>
  );
}