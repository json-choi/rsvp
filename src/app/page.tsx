import { getLandingImage, getTextSettings } from './admin/adminActions';
import HomeClient from './HomeClient';

export default async function Home() {
  const [landingImage, texts] = await Promise.all([getLandingImage(), getTextSettings()]);
  return <HomeClient landingImage={landingImage} texts={texts} />;
}
