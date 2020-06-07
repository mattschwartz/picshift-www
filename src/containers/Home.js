import React from 'react'
import WelcomeFold from '../components/Home/WelcomeFold'
import SiteInfo from '../components/Home/SiteInfo'

import '../styles/home.css'

class Home extends React.Component {

    render() {
        return (
            <div className="home">
                <section>
                    <WelcomeFold />
                </section>
                <section>
                    <div className="container">
                        <h1 className="section-header">Vision</h1>
                        <strong>Picshift is Google photos, for <em>your</em> photos. The photos are yours, and they stay only with you. Forever.</strong>

                        Picshift keeps all of your photos, and any sensitive information physically in your hands. Your various connected devices
                        &mdash; such as your phone, tablet, and PC &mdash; act as a sort of personal cloud. None of your data is ever shared with us ([1]).
                        <h1 className="section-header">Features</h1>

                        The feature list is incomplete and changes frequently.

                        <li>It supports local network and p2p internet network to connect your devices so that you
                        can experience the cloud, without giving data to it.</li>

                        <li>Connect and use the entirity of the app, without providing anyone a single bit of
                        identifying information about you.</li>

                        <li>We can guarantee that your data will never be used for any external use
                        because we do not ever have your data. Your data stays on all of your devices
                        and uses simple transport protocols over the internet directly without going
                        through any servers.</li>
                        <li>
                            Connections are done with a one-time, revokable, secure handshake that allows:
                            <ul>
                                <li>them to perform discovery between them;</li>
                                <li>self-backup if you desire;</li>
                                <li>self-erasure if you desire, on disassociation/revokation</li>
                            </ul>
                        </li>
                        <li>You can share photos with other users as well, with extensive and explicit permission
                        allowances that you to manage what they can see, what actions they can take,
                        in-simple-to-understand language</li>
                        <li>
                            You can generate app links for your images
                            <ul>
                                <li>This allows you to send someone who has the app, over the internet,
                                to be able to view a single image from your personal cloud
                                similar to using an image sharing website</li>
                            </ul>
                        </li>
                        <li>You can set up a Master device to handle all of these devices</li>
                        <li>
                            You can override the Master device, should it get stolen broken or lost, with a
                            list of override-tokens to change Masters
                            <ul>
                                <li>override-tokens can each be used only once.</li>
                                <li>if you use an override-token, a new one will be generated for you to replace it</li>
                                <li>can pull all images from every device to master device discreetly</li>
                                <li>if all are completely lost, you will be unable to claim your Master device</li>
                            </ul>
                        </li>
                        <li>Notify you if someone is attempting to override a device with a Master reset command</li>
                        <li>
                            Partnered devices can remove themselves from the Master device at will, which does the following:
                            <ul>
                                <li>Can choose whether to keep all photos currently on the device</li>
                                <li>Can keep all photos synced to it</li>
                                <li>Can delete its personal photos from other devices it is synced to, which can run discreetly</li>
                            </ul>
                        </li>
                        <li>
                            You can perform advanced search queries
                        </li>
                        <li>Control how much storage you want to allocate to saving devices, dedicate storage from other devices to automatically handle archiving
                        photos that don't get seen as much, or haven't accessed recently. Or, can designate dedicated backup devices implicitly, so that all photos are saved to that device</li>
                        <li>
                            More interesting ways to interact with your photos:
                            <ul>
                                <li>You can have it bring up a random assortment of photos. Not by randomizing a folder,
                                but by randomizing an entire library, across all of your folders, across all of your
                                devices</li>

                                <li>Quickly search by tags, date ranges, faces and people</li>
                                <li>Search similar and related images.</li>
                                <li>Liked that photo you were just looking at? Click to search for others like it.</li>

                                <li>
                                    Start a shared photo party, where you can invite any number of people and all of them
                                    can share pictures to the album while you watch. Perfect for families who like to
                                    look at images with each other and reminesce about those times. Privacy settings:
                                    <ul>

                                        <li>Require password to join</li>
                                        <li>Limit duration the album can be open</li>
                                        <li>Control whether, or which, users can save shared downloads to their personal cloud</li>
                                    </ul>
                                </li>
                            </ul>
                        </li>

                        <hr />
                        <div className="text-small">
                            <div>([1]) This website, however, does collect simple, anonymized, and aggregated data to gauge interest for the idea. No personal or specific data about you is collected.</div>

                            <div>Comprehensively, this is/will be:</div>
                            <ul>
                                <li>Number of website visitors</li>
                                <li>Number of website visitors</li>
                            </ul>
                        </div>
                    </div>
                </section>
                <section style={{ backgroundColor: '#233140' }}>
                    <div className="container pb-5">
                        <div className="row">
                            <div className="col-sm">
                            </div>
                            <div className="col-sm">
                                <SiteInfo />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        )
    }
}

export default Home
