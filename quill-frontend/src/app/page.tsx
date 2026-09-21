import { auth } from "@/auth";
import MainSection from "@/components/MainSection";
import LinkedInHighlight from "@/components/LinkedInHighlight";
import Workflow from "@/components/Workflow";
import CommentsHighlight from "@/components/CommentsHighlight";
import ReadingHub from "@/components/ReadingHub";
import Footer from "@/components/Footer";

const LandingPage = async () => {
  // Reachable while signed in, so the calls to action adapt rather than
  // inviting you to log in again.
  const session = await auth();
  const signedIn = Boolean(session?.user);

  return (
    <main>
      <MainSection signedIn={signedIn} />
      <LinkedInHighlight />
      <Workflow />
      <CommentsHighlight />
      <ReadingHub signedIn={signedIn} />
      <Footer signedIn={signedIn} />
    </main>
  );
};

export default LandingPage;
