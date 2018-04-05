<?php
namespace Jonysosin\PWA\Block;

class PWA extends \Magento\Framework\View\Element\Template {

    public function getCacheUrls() {
        return [
            "/privacy-policy-cookie-restriction-mode/"
        ];
    }
}