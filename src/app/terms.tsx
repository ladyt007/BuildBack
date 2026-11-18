import { contactSentence, LegalPage } from '@/components/legal-page';
import { Config } from '@/lib/config';

export default function TermsScreen() {
  const us = Config.operatorName;
  return (
    <LegalPage
      title="Terms of Use"
      updated="November 2026"
      intro={`BuildBack helps communities find and support local businesses and neighbors in need. These terms are an agreement between you and ${us} ("we", "us"). By creating an account or using BuildBack you agree to them. If you don't agree, please don't use BuildBack.`}
      sections={[
        {
          heading: 'Who can use BuildBack',
          paragraphs: [
            'You must be at least 13 years old to use BuildBack, and at least 18 to list a business, claim a listing or ask for help. If you use BuildBack for a business, you confirm you’re allowed to act for it.',
            'Keep your password private. You’re responsible for what happens under your account.',
          ],
        },
        {
          heading: 'Community rules (zero tolerance)',
          paragraphs: [
            'BuildBack is built on trust. We do not tolerate objectionable content or abusive users. You agree not to post or do anything that is: false or misleading; a scam or fraud; hateful, harassing, threatening, sexually explicit or violent; someone else’s private information; something you don’t have the right to share, including photos of other people without their permission; or illegal.',
            'Only list or claim a business you run, and only ask for help for yourself or your own family. Nominations must be real businesses, and the contact details you give must be the business’s public ones.',
            'Anyone can report content or block a person from inside the app. We review reports, usually within a day, remove content that breaks these rules, and may suspend or remove accounts that break them.',
          ],
        },
        {
          heading: 'Giving and money',
          paragraphs: [
            'BuildBack never handles money. When you give, you go to the business’s or person’s own payment or fundraising page (such as Cash App, PayPal, Stripe or GoFundMe), and that service’s terms apply.',
            'We review help requests before they’re shared, but we can’t guarantee that any business or person is who they say, or how gifts will be used. Please give thoughtfully. Gifts are generally not tax-deductible unless the recipient is a registered charity.',
            'Amounts shown on BuildBack are reported by the people who gave and aren’t verified.',
          ],
        },
        {
          heading: 'Your content',
          paragraphs: [
            'You own what you post. You give us permission to store, display and share it within BuildBack and on our website so the service can work, for as long as it’s posted.',
            'You can edit your listings and requests, and you can delete your account at any time from the Me tab, which deletes the content you own.',
          ],
        },
        {
          heading: 'Nominated and claimed listings',
          paragraphs: [
            'Neighbors can nominate a business they don’t own. We review nominations and invite the owner to claim their free listing. Owners who claim a listing take responsibility for it. If you believe a listing about your business is wrong, claim it or report it.',
          ],
        },
        {
          heading: 'Paid plans',
          paragraphs: [
            'Listing a business is free. Optional paid plans, where offered on our website, are billed by our payment provider under the terms shown at checkout.',
          ],
        },
        {
          heading: 'Disclaimers',
          paragraphs: [
            'BuildBack is provided “as is”. We work hard to keep it running and accurate, but we can’t promise it will always be available, error-free, or that information posted by others is correct.',
            `To the fullest extent the law allows, ${us} isn’t liable for indirect or consequential losses, or for anything that happens between you and a business or person you find on BuildBack, including gifts made through outside payment pages.`,
          ],
        },
        {
          heading: 'Changes and contact',
          paragraphs: [
            'We may update these terms. If the changes are important, we’ll let you know in the app. Continuing to use BuildBack means you accept the updated terms.',
            `Questions? Please ${contactSentence()}.`,
          ],
        },
      ]}
    />
  );
}
